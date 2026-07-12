#!/usr/bin/env bash
# Build + deploy natt_escrow on devnet using official Anchor Docker image (no local Rust).
set -euo pipefail
ESCROW_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HACKATHON_DIR="$(cd "${ESCROW_DIR}/.." && pwd)"
cd "${ESCROW_DIR}"

ANCHOR_IMAGE="${ANCHOR_IMAGE:-solanafoundation/anchor:v0.31.1}"
NODE_IMAGE="${NODE_IMAGE:-node:22-alpine}"
SOLANA_DIR="${HOME}/.config/solana"
DEPLOY_DIR="${ESCROW_DIR}/target/deploy"

mkdir -p "${SOLANA_DIR}" "${DEPLOY_DIR}"

run_node() {
  docker run --rm \
    -v "${HACKATHON_DIR}:/hackathon" \
    -w /hackathon/solana-escrow \
    "${NODE_IMAGE}" \
    sh -c "npm install --omit=dev --silent && node $*"
}

run_anchor() {
  docker run --rm \
    -v "${HACKATHON_DIR}:/hackathon" \
    -v "${SOLANA_DIR}:/root/.config/solana" \
    -w /hackathon/solana-escrow \
    "${ANCHOR_IMAGE}" \
    bash -lc "$1"
}

echo "==> Pull images"
docker pull "${ANCHOR_IMAGE}"
docker pull "${NODE_IMAGE}"

echo "==> Program id"
PROGRAM_ID="$(run_node scripts/generate-program-keypair.mjs | tail -1)"
echo "Program ID: ${PROGRAM_ID}"
run_node scripts/sync-program-id.mjs || true

if [ ! -f "${SOLANA_DIR}/id.json" ]; then
  echo "==> New devnet deployer wallet"
  docker run --rm -v "${SOLANA_DIR}:/root/.config/solana" "${ANCHOR_IMAGE}" \
    solana-keygen new --no-bip39-passphrase -o /root/.config/solana/id.json --force
fi

echo "==> Devnet airdrop"
run_anchor 'solana config set --url devnet && solana address'
ADDR="$(run_anchor 'solana address' | tail -1)"
for i in 1 2 3 4 5 6 7 8; do
  BAL="$(run_anchor 'solana balance' | awk "{print \$1}")"
  if awk "BEGIN {exit !($BAL >= 2)}"; then
    echo "balance ok: ${BAL} SOL"
    break
  fi
  echo "airdrop attempt $i (${BAL} SOL)"
  run_anchor 'solana airdrop 1 || true' || true
  curl -sf -X POST https://api.devnet.solana.com \
    -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"requestAirdrop\",\"params\":[\"'"${ADDR}"'\",1000000000]}" \
    >/dev/null || true
  sleep 20
done
run_anchor 'solana balance'

echo "==> anchor build"
run_anchor 'bash /hackathon/solana-escrow/scripts/anchor-build-pinned.sh'

BAL_DEPLOY="$(run_anchor 'solana balance | awk "{print \$1}"' | tail -1)"
echo "Deployer balance: ${BAL_DEPLOY} SOL"
if ! awk -v bal="${BAL_DEPLOY}" 'BEGIN { exit !(bal + 0 >= 2) }'; then
  echo ""
  echo "BLOCKED: deployer needs >= 2 SOL on devnet."
  echo "Fund: $(run_anchor 'solana address' | tail -1)"
  echo "Then: cd ~/HYPERNATT && bash hackathon/solana-escrow/scripts/deploy-devnet-docker.sh"
  exit 1
fi

echo "==> anchor deploy"
run_anchor 'anchor deploy --provider.cluster devnet'

cp -f target/idl/natt_escrow.json "${HACKATHON_DIR}/natt-pundit/apps/web/idl/natt_escrow.json" 2>/dev/null \
  || cp -f "${HACKATHON_DIR}/natt-pundit/apps/web/idl/natt_escrow.json" "${HACKATHON_DIR}/natt-pundit/apps/web/idl/natt_escrow.json"
if [ -f target/idl/natt_escrow.json ]; then
  cp -f target/idl/natt_escrow.json "${HACKATHON_DIR}/natt-pundit/apps/web/public/natt-escrow-idl.json"
elif [ -f "${HACKATHON_DIR}/natt-pundit/apps/web/idl/natt_escrow.json" ]; then
  cp -f "${HACKATHON_DIR}/natt-pundit/apps/web/idl/natt_escrow.json" "${HACKATHON_DIR}/natt-pundit/apps/web/public/natt-escrow-idl.json"
  echo "WARN: used committed IDL (anchor idl build skipped)"
else
  echo "ERROR: no natt_escrow.json IDL found"
  exit 1
fi

echo ""
echo "DONE devnet deploy."
echo "NATT_ESCROW_CLUSTER=devnet"
echo "NATT_ESCROW_ENABLED=true"
echo "NEXT_PUBLIC_NATT_ESCROW_CLUSTER=devnet"
echo "NEXT_PUBLIC_NATT_ESCROW_ENABLED=true"
echo "NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=${PROGRAM_ID}"
