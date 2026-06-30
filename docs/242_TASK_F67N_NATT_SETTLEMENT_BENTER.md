# 242 — TASK F67N Natt Settlement (Benter edge doctrine)

> **Statut** : TASK — execution ordonnee P1 -> P2 -> P3 -> assurance -> deploy.
> **SPEC** : `241_SPEC_F67N_NATT_SETTLEMENT_BENTER.md`
> **Skill ref** : nattapp-work-method SS3 TASK + SS4b ASSURANCE + SS5 DEPLOY

## T-DOC — Triplet (fait)

- [x] 240_AUDIT
- [x] 241_SPEC
- [x] 242_TASK

## T-P1 — Live odds

| # | Tache | Done |
|---|-------|------|
| 1 | `priceToImplied` + Pct normalize dans txlineMap | |
| 2 | SuperOddsType case-insensitive | |
| 3 | `GET /v1/fixtures/:id/odds/debug` + ODDS_DEBUG | |
| 4 | Unit tests `txlineMap.test.ts` | |

**Test** :
```bash
cd hackathon/natt-pundit
npm run test -w @natt-pundit/txline-gateway
```

## T-P2 — Real proof

| # | Tache | Done |
|---|-------|------|
| 1 | `txlineProof.ts` proxy stat-validation | |
| 2 | Extend SettlementProof schema (`source`) | |
| 3 | Wire `/proof` route | |
| 4 | SettlementProofPanel source + explorer | |

**Smoke** :
```bash
curl -sf https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18175397/proof
# expect source=txline when scores exist
```

## T-P3 — pi_model

| # | Tache | Done |
|---|-------|------|
| 1 | MODEL_* in config.ts | |
| 2 | modelProbFromFeatures rewrite | |
| 3 | natt_edge pass lines/events | |
| 4 | consensus.test.ts + property | |

**Test** :
```bash
cd hackathon/natt-pundit
npm test
```

## T-ASSURANCE

```bash
cd hackathon/natt-pundit
npm test
npm run build
```

Gate : **0 failures**.

## T-DEPLOY

**Local commit** (paths explicites) :
```cmd
git add hackathon/natt-pundit/docs/240_* hackathon/natt-pundit/docs/241_* hackathon/natt-pundit/docs/242_* hackathon/natt-pundit/packages hackathon/natt-pundit/services hackathon/natt-pundit/apps/web/components/SettlementProofPanel.tsx hackathon/natt-pundit/package.json hackathon/natt-pundit/package-lock.json
git commit -m "feat(hackathon F67N): Benter edge phases P1-P3 — live odds, TxLINE proofs, pi_model"
git push origin main
```

**VPS** :
```bash
cd ~/HYPERNATT && export COMPOSE_FILE=docker-compose.prod.yml && git pull origin main && docker compose up -d --build --no-deps natt-pundit-gateway natt-pundit-edge-api natt-pundit-web && docker compose restart nginx
```

## T-SMOKE (bloquant)

```bash
curl -sf https://hypernatt.com/api/natt-pundit/txline/health
curl -sf https://hypernatt.com/api/natt-pundit/edge/health
curl -sf https://hypernatt.com/api/natt-pundit/txline/v1/fixtures | jq '.fixtures | length'
curl -sf https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18175397/odds | jq '.odds | length'
curl -sf https://hypernatt.com/api/natt-pundit/edge/v1/edge/18175397/verdict | jq '.pi_tx'
curl -sf https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18175397/proof | jq '.source'
```

## Done criteria

- [ ] P1 PASS — odds non vides scheduled fixture
- [ ] P2 PASS — proof source txline (ou documented HOLD if no seq)
- [ ] P3 PASS — tests verts
- [ ] build PASS
- [ ] smoke PASS post-deploy
