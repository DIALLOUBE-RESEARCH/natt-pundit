# 245 — TASK F68N Natt Settlement verify live public

> **Statut** : TASK — execution P4 -> P5 -> P6 -> assurance -> deploy.
> **SPEC** : `244_SPEC_F68N_NATT_SETTLEMENT_VERIFY_LIVE_PUBLIC.md`
> **Skill ref** : nattapp-work-method SS3 TASK + SS4b + SS5

## T-DOC

- [x] 243_AUDIT
- [x] 244_SPEC
- [x] 245_TASK

## T-P4 — Merkle verify

| # | Tache | Done |
|---|-------|------|
| 1 | merkle_verify.ts + exports | |
| 2 | merkle_verify.test.ts vector 18172280 | |
| 3 | txlineProof validated field | |
| 4 | GET /proof/verify | |
| 5 | SettlementProofPanel green badge | |

## T-P5 — Live board

| # | Tache | Done |
|---|-------|------|
| 1 | edge-api /v1/edge/summary | |
| 2 | EdgeSummarySchema | |
| 3 | MatchCard + EdgeBadge | |
| 4 | index.tsx fetch + sort | |

## T-P6 — Public kit

| # | Tache | Done |
|---|-------|------|
| 1 | README two-source math | |
| 2 | SUBMISSION_KIT.md | |
| 3 | sync-public-github.ps1 | |
| 4 | sync -Push (owner creds) | |

## T-ASSURANCE

```bash
cd hackathon/natt-pundit
npm test
npm run build
```

## T-DEPLOY

```cmd
git add hackathon/natt-pundit/...
git commit -m "feat(hackathon F68N): Merkle verify, live SETUP board, submission kit"
git push origin main
```

VPS:
```bash
cd ~/HYPERNATT && export COMPOSE_FILE=docker-compose.prod.yml && git pull origin main && docker compose up -d --build --no-deps natt-pundit-gateway natt-pundit-edge-api natt-pundit-web && docker compose restart nginx
```

## T-SMOKE

```bash
curl -sf https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof | jq .validated
curl -sf https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary | jq '.items|length'
curl -sf -o /dev/null -w "%{http_code}" https://hypernatt.com/fr/nattpundit
```

## Done criteria

- [ ] npm test + build PASS
- [ ] smoke validated + summary + 200
- [ ] commit pushed main
