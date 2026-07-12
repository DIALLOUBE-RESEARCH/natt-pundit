#!/usr/bin/env bash
# F75N — Upgrade natt_escrow on devnet (Docker + local TLS proxy for api.devnet.solana.com).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ESCROW_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
HACKATHON_DIR="$(cd "${ESCROW_DIR}/.." && pwd)"
cd "${ESCROW_DIR}"
set -a
source "${HOME}/HYPERNATT/.env"
set +a
ANCHOR_IMAGE="${ANCHOR_IMAGE:-solanafoundation/anchor:v0.31.1}"
NODE_IMAGE="${NODE_IMAGE:-node:22-alpine}"
PROXY_PORT="${DEVNET_PROXY_PORT:-18899}"
PROXY_URL="http://127.0.0.1:${PROXY_PORT}"
RPC_URL="${SOLANA_DEVNET_RPC_URL:-https://api.devnet.solana.com}"
HELIUS_KEY="$(grep -E '^HELIUS_API_KEY=' "${HOME}/HYPERNATT/.env" 2>/dev/null | cut -d= -f2- | tr -d '\r"' || true)"
if [ -n "${HELIUS_KEY}" ]; then
  RPC_URL="https://devnet.helius-rpc.com/?api-key=${HELIUS_KEY}"
  USE_PROXY=0
  DEPLOY_RPC="${RPC_URL}"
  echo "==> RPC: Helius devnet"
else
  USE_PROXY=1
  DEPLOY_RPC="${PROXY_URL}"
  echo "==> RPC: local proxy -> ${RPC_URL}"
fi
cleanup() {
  docker rm -f natt-devnet-rpc-proxy >/dev/null 2>&1 || true
}
trap cleanup EXIT
if [ "${USE_PROXY}" = "1" ]; then
  docker rm -f natt-devnet-rpc-proxy >/dev/null 2>&1 || true
  docker run -d --name natt-devnet-rpc-proxy --network host \
    -e "SOLANA_DEVNET_RPC_URL=${RPC_URL}" \
    -e "DEVNET_PROXY_PORT=${PROXY_PORT}" \
    -v "${HACKATHON_DIR}:/hackathon" \
    "${NODE_IMAGE}" \
    node /hackathon/solana-escrow/scripts/devnet-rpc-proxy.mjs
  sleep 2
  curl -sf -X POST "${PROXY_URL}" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' >/dev/null \
    || { echo "WARN: devnet RPC proxy unhealthy — falling back to direct URL"; USE_PROXY=0; DEPLOY_RPC="${RPC_URL}"; }
fi
echo "==> Build"
docker run --rm --network host \
  -v "${HACKATHON_DIR}:/hackathon" \
  -v "${HOME}/.config/solana:/root/.config/solana" \
  -w /hackathon/solana-escrow \
  "${ANCHOR_IMAGE}" \
  bash -lc 'bash scripts/anchor-build-pinned.sh'
echo "==> Upgrade program GPSU49..."
SO_BYTES="$(wc -c < target/deploy/natt_escrow.so | tr -d ' ')"
MAX_LEN="$((SO_BYTES + 16384))"
docker run --rm --network host \
  -v "${HACKATHON_DIR}:/hackathon" \
  -v "${HOME}/.config/solana:/root/.config/solana" \
  -w /hackathon/solana-escrow \
  "${ANCHOR_IMAGE}" \
  bash -lc "solana config set --url '${DEPLOY_RPC}' && solana program extend GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD 16384 -k /root/.config/solana/id.json || true && solana program deploy target/deploy/natt_escrow.so --program-id GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD --upgrade-authority /root/.config/solana/id.json -k /root/.config/solana/id.json --max-len ${MAX_LEN} --use-rpc --max-sign-attempts 500"
echo "DONE upgrade devnet"
