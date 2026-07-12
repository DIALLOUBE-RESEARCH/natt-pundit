#!/usr/bin/env bash
# Deploy natt_escrow to Solana DEVNET (free — hackathon demo).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Program id sync"
PROGRAM_ID="$(node scripts/sync-program-id.mjs 2>/dev/null | grep 'Synced program id' | awk '{print $4}')"
if [ -z "$PROGRAM_ID" ]; then
  PROGRAM_ID="$(node scripts/generate-program-keypair.mjs)"
fi
echo "Program ID: $PROGRAM_ID"

echo "==> Solana devnet"
solana config set --url devnet
solana config get

BAL=$(solana balance | awk '{print $1}')
if awk "BEGIN {exit !($BAL < 1)}"; then
  echo "==> Airdrop devnet SOL"
  solana airdrop 2 || solana airdrop 1
fi
solana balance

echo "==> Build + deploy"
anchor build
anchor deploy --provider.cluster devnet

cp target/idl/natt_escrow.json ../natt-pundit/apps/web/public/natt-escrow-idl.json
cp target/idl/natt_escrow.json ../natt-pundit/apps/web/idl/natt_escrow.json

echo ""
echo "DONE (devnet). Add to ~/HYPERNATT/.env.natt_pundit :"
echo "NATT_ESCROW_CLUSTER=devnet"
echo "NATT_ESCROW_ENABLED=true"
echo "NEXT_PUBLIC_NATT_ESCROW_CLUSTER=devnet"
echo "NEXT_PUBLIC_NATT_ESCROW_ENABLED=true"
echo "NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=$PROGRAM_ID"
echo "SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com"
