# Escrow keeper (F96N P1)

Permissionless **settle-only** worker for Natt Pundit devnet pools.

## Role

- Poll `txline-gateway` for **finished** fixtures
- Skip pools that are missing, already settled, or **solo-side** (unmatched)
- Fetch `/v1/fixtures/:id/cpi-args?outcome=` and broadcast `settle` with a VPS fee-payer keypair
- **Never** claims or refunds on behalf of users (user wallet signs `claim` / `refund`)

## Env (VPS `~/HYPERNATT/.env` only)

| Variable | Default | Notes |
|----------|---------|-------|
| `NATT_PUNDIT_ESCROW_KEEPER_ENABLED` | `false` | Kill switch |
| `ESCROW_KEEPER_KEYPAIR` | — | base58 secret or JSON byte array; **`.env.natt_pundit` on VPS only** — not interpolated from `~/HYPERNATT/.env` |
| `PUNDIT_GATEWAY_URL` | `http://natt-pundit-gateway:4001` | Internal compose |
| `ESCROW_KEEPER_POLL_MS` | `60000` | 15s–300s clamp |
| `ESCROW_KEEPER_PORT` | `4013` | Health HTTP |
| `SOLANA_DEVNET_RPC_URL` | devnet public | Same as MCP/web |

Fund the keeper pubkey with devnet SOL (tx fees only).

## Web flag

Rebuild `natt-pundit-web` with `NEXT_PUBLIC_NATT_ESCROW_KEEPER_ENABLED=true` so fans see **Règlement en cours…** instead of manual settle.

## Smoke

```bash
curl -sf http://localhost:4013/health
```

## Tests

```bash
cd hackathon/natt-pundit/services/escrow-keeper && npm test
```
