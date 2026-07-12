#!/usr/bin/env bash
set -euo pipefail
cd ~/HYPERNATT
for f in .env .env.natt_pundit; do
  [ -f "$f" ] || continue
  grep -q '^NATT_ESCROW_CLUSTER=' "$f" && sed -i 's/^NATT_ESCROW_CLUSTER=.*/NATT_ESCROW_CLUSTER=devnet/' "$f" || echo 'NATT_ESCROW_CLUSTER=devnet' >> "$f"
  grep -q '^NATT_ESCROW_ENABLED=' "$f" && sed -i 's/^NATT_ESCROW_ENABLED=.*/NATT_ESCROW_ENABLED=true/' "$f" || echo 'NATT_ESCROW_ENABLED=true' >> "$f"
  grep -q '^NEXT_PUBLIC_NATT_ESCROW_CLUSTER=' "$f" && sed -i 's/^NEXT_PUBLIC_NATT_ESCROW_CLUSTER=.*/NEXT_PUBLIC_NATT_ESCROW_CLUSTER=devnet/' "$f" || echo 'NEXT_PUBLIC_NATT_ESCROW_CLUSTER=devnet' >> "$f"
  grep -q '^NEXT_PUBLIC_NATT_ESCROW_ENABLED=' "$f" && sed -i 's/^NEXT_PUBLIC_NATT_ESCROW_ENABLED=.*/NEXT_PUBLIC_NATT_ESCROW_ENABLED=true/' "$f" || echo 'NEXT_PUBLIC_NATT_ESCROW_ENABLED=true' >> "$f"
  grep -q '^NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=' "$f" && sed -i 's/^NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=.*/NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD/' "$f" || echo 'NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD' >> "$f"
  grep -q '^SOLANA_DEVNET_RPC_URL=' "$f" && sed -i 's|^SOLANA_DEVNET_RPC_URL=.*|SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com|' "$f" || echo 'SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com' >> "$f"
done
export COMPOSE_FILE=docker-compose.prod.yml
export NATT_ESCROW_ENABLED=true
export NEXT_PUBLIC_NATT_ESCROW_ENABLED=true
export NEXT_PUBLIC_NATT_ESCROW_CLUSTER=devnet
export NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD
docker compose up -d --build natt-pundit-gateway natt-pundit-web
docker exec natt-pundit-gateway printenv NATT_ESCROW_ENABLED
