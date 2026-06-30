# Natt Settlement

**TxODDS World Cup — Prediction Markets & Settlement** track (Superteam). Live Shin consensus, two-source logit combine, SETUP/HOLD edge, Merkle settlement verification.

| | |
|---|---|
| **Live app** | https://hypernatt.com/fr/nattpundit |
| **Hackathon** | TxODDS World Cup — Prediction Markets & Settlement (deadline 2026-07-19) |
| **TxLINE docs** | https://txline.txodds.com/documentation/worldcup |
| **Public mirror** | https://github.com/DIALLOUBE-RESEARCH/natt-pundit (sync script) |

---

## What it does

- **2D dashboard**: WC fixtures, live odds (TxLINE), scores, SETUP/HOLD badges on home grid
- **Edge math**: Shin `pi_tx` + Natt `pi_model` -> logit combine `c`; **SETUP** iff `c - pi_tx > epsilon_net` (0.03, pre-registered)
- **Settlement**: TxLINE stat-validation Merkle proofs verified off-chain (SHA-256, sibling order); green badge when `validated=true`
- **Activate**: Solana wallet + TxLINE apiToken at `/activate`

## Two-source logit combine (edge)

```
logit(c) = alpha * logit(pi_tx) + beta * logit(pi_model)
edge_score = c - pi_tx
SETUP if edge_score > EPSILON_NET else HOLD
```

| Constant | Value | Role |
|----------|-------|------|
| EPSILON_NET | 0.03 | SETUP gate |
| COMBINE_ALPHA/BETA | 1 / 1 | logit weights |
| MODEL_* | see `packages/natt-core/src/config.ts` | pi_model features (fixed pre-submit) |

`pi_tx` = Shin de-vig on TxLINE full-time 1X2. `pi_model` = heuristic on score diff, minute proxy, odds momentum (no post-hoc tuning).

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 14 (`apps/web`) |
| TxLINE proxy | Hono (`services/txline-gateway`) |
| Edge | Hono + `@natt-pundit/natt-core` (`services/edge-api`) |
| Pure math | `packages/natt-core` (shin, combine, merkle_verify) |

## API (public via hypernatt nginx)

| Service | Base | Key routes |
|---------|------|------------|
| Gateway | `/api/natt-pundit/txline` | `/v1/fixtures`, `/v1/fixtures/:id/odds`, `/v1/fixtures/:id/proof`, `/v1/fixtures/:id/proof/verify` |
| Edge | `/api/natt-pundit/edge` | `/v1/edge/:id`, `/v1/edge/:id/verdict`, `/v1/edge/summary` |

## Quick start (local)

```bash
cd hackathon/natt-pundit
npm install
npm run build
npm test
npm run dev
```

- App: http://localhost:3000
- Gateway: http://localhost:4001/health
- Edge API: http://localhost:4002/health

Copy `.env.example` to `.env` for local overrides. **Never commit** `TXLINE_API_TOKEN`.

## Deploy

See `DEPLOY.md`. VPS services: `natt-pundit-gateway`, `natt-pundit-edge-api`, `natt-pundit-web`.

Jury kit: `docs/SUBMISSION_KIT.md`

## License

MIT — see [LICENSE](LICENSE).
