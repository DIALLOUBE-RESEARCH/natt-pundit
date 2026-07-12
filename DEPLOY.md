# Deploy Natt Settlement

**Live app (English UI):** https://hypernatt.com/fr/nattpundit?lang=en

## Prod routes

| Surface | URL |
|---------|-----|
| Web | `https://hypernatt.com/fr/nattpundit?lang=en` |
| TxLINE proxy | `https://hypernatt.com/api/natt-pundit/txline/` |
| Edge API | `https://hypernatt.com/api/natt-pundit/edge/` |

## VPS deploy (maintainers)

**F86N v2:** the edge formula is not in git — see [`docs/ENGINE_VPS_ONLY.md`](docs/ENGINE_VPS_ONLY.md).

```bash
cd ~/HYPERNATT && bash hackathon/natt-pundit/scripts/ensure-edge-engine.sh && export COMPOSE_FILE=docker-compose.prod.yml && git pull origin main && docker compose up -d --build natt-pundit-gateway natt-pundit-edge-api natt-pundit-web && docker compose restart nginx
```

`.env.natt_pundit` variables (VPS only, never commit):

```bash
TXODDS_MOCK=true
TXLINE_API_TOKEN=
CORS_ORIGIN=https://hypernatt.com
NEXT_PUBLIC_EDGE_API_URL=https://hypernatt.com/api/natt-pundit/edge
NATT_ESCROW_ENABLED=false
NEXT_PUBLIC_NATT_ESCROW_ENABLED=false
NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=
```

Enable escrow after Anchor deploy + `.view()` smoke:

```bash
NATT_ESCROW_ENABLED=true
NEXT_PUBLIC_NATT_ESCROW_ENABLED=true
NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=<deployed_program_id>
```

Data Lab ZIP export (SIWS gate — set on VPS `.env.natt_pundit`):

```bash
NATT_DATAS_EXPORT_TOKEN_SECRET=<random-32+-chars>
NATT_DATAS_EXPORT_INTERNAL_SECRET=<shared-edge-web>
# optional extra allowlist pubkeys (built-in owner key also accepted)
NATT_DATAS_EXPORT_WHITELIST=
```

Without these secrets, `/datas` export button returns 503; direct `GET /v1/data/export` returns 403 when internal secret is set.

## Escrow devnet (F71N — zero mainnet SOL)

| Surface | Network |
|---------|---------|
| Edge + Merkle proof (live WC) | **mainnet** TxLINE data (unchanged) |
| Escrow pool + CPI settle | **devnet** (free) |

Deploy program (WSL/Mac/Linux, disposable devnet wallet):

```bash
cd hackathon/solana-escrow
bash scripts/deploy-devnet.sh   # solana airdrop auto
```

`.env.natt_pundit` after deploy:

```bash
NATT_ESCROW_CLUSTER=devnet
NATT_ESCROW_ENABLED=true
NEXT_PUBLIC_NATT_ESCROW_CLUSTER=devnet
NEXT_PUBLIC_NATT_ESCROW_ENABLED=true
NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID=GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD
```

**WalletConnect:** the user signs deposit/settle/claim — **never** a private key on the VPS.

TxLINE devnet: enable a subscription on **devnet** (`txline-dev.txodds.com`) with the same wallet, then optional `TXLINE_DEV_API_TOKEN`.

---

## Local dev

```bash
cd hackathon/natt-pundit
npm install
npm run dev
docker compose -f docker-compose.hackathon.yml up -d --build
```

## Smoke

```bash
curl -sf https://hypernatt.com/api/natt-pundit/txline/health
curl -sf https://hypernatt.com/api/natt-pundit/edge/health
curl -sf -o /dev/null -w "%{http_code}\n" "https://hypernatt.com/fr/nattpundit?lang=en"
# escrow (503 expected until NATT_ESCROW_ENABLED=true)
curl -sf -o /dev/null -w "%{http_code}\n" "https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/cpi-args?outcome=home"
```

## Teardown

```bash
docker compose -f docker-compose.prod.yml stop natt-pundit-gateway natt-pundit-edge-api natt-pundit-web
docker compose -f docker-compose.prod.yml rm -f natt-pundit-gateway natt-pundit-edge-api natt-pundit-web
```
