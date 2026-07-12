#!/usr/bin/env bash
# Deploy natt_escrow to Solana mainnet.
# Requires: anchor 0.31.1, solana CLI, ~/.config/solana/id.json with SOL (~0.3+).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Program id sync"
PROGRAM_ID="$(node scripts/sync-program-id.mjs | tail -1 | sed 's/.*=//')"
echo "Program ID: $PROGRAM_ID"

echo "==> Solana config"
solana config get
solana balance

echo "==> Build"
anchor build

echo "==> Deploy"
anchor deploy --provider.cluster mainnet

echo "==> Copy IDL to web"
cp target/idl/natt_escrow.json ../natt-pundit/apps/web/public/natt-escrow-idl.json
cp target/idl/natt_escrow.json ../natt-pundit/apps/web/idl/natt_escrow.json

echo ""
echo "DONE. Add to ~/HYPERNATT/.env.natt_pundit :"
echo "NATT_ESCROW_ENABLED=true"
echo "NEXT_PUBLIC_NATT_ESCROW_ENABLED=true"
echo "NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=$PROGRAM_ID"
echo ""
echo "Then rebuild natt-pundit-gateway + natt-pundit-web (see hackathon/natt-pundit/DEPLOY.md)"
