# 241 — SPEC F67N Natt Settlement (Benter edge doctrine)

> **Statut** : SPEC — GO TASK (owner implicit).
> **Audit** : `240_AUDIT_F67N_NATT_SETTLEMENT_BENTER.md`
> **Skill ref** : nattapp-work-method SS2 SPEC

## 1. Objectifs falsifiables

| ID | Objectif | Gate PASS |
|----|----------|-----------|
| P1 | Live odds TxLINE mappes vers OddsLine[] | >=1 scheduled fixture odds length>0 prod; unit mapOdds |
| P2 | Settlement proof depuis TxLINE | `source=txline` quand token; mock si TXODDS_MOCK=true |
| P3 | pi_model credible pre-enregistre | modelProbFromFeatures + tests; property c in (0,1) |
| E2E | Edge SETUP possible | pi_tx>0 et edge_score calcule; SETUP si > EPSILON_NET (data-dependent) |

## 2. Hors-scope

- Wallet subscribe/activate flow (existant)
- On-chain validate_stat write (read-only simulation optionnel UI)
- ML training / tuning coefficients post-data
- Nom public "benter" dans routes ou types exportes

## 3. Phases

### Phase P1 — txline-gateway live odds

**Marche Shin** : full-time 1X2 prioritaire (`1X2_PARTICIPANT_RESULT`, `MarketPeriod` null/empty).
Fallbacks ordonnes : any 1X2 period -> OU FT -> AH FT -> premiere ligne avec Pct ou Prices.

**Modules** :

| Module | Changement |
|--------|------------|
| `txlineMap.ts` | `priceToImplied`, normalisation SuperOddsType, Pct formats (`27.5`, `27.5%`) |
| `txline.ts` | `getFixtureOddsDebug` (raw shape) |
| `index.ts` | `GET /v1/fixtures/:id/odds/debug` si `ODDS_DEBUG=true` |

### Phase P2 — real settlement proof

**TxLINE API** : `GET /api/scores/stat-validation?fixtureId=&seq=&statKey=1002` (home goals stat; docs on-chain validation).

| Module | Changement |
|--------|------------|
| `txlineProof.ts` | fetch scores snapshot, extract seq, proxy stat-validation, map SettlementProof |
| `txline.ts` | `getFixtureProof(fixtureId)` |
| `index.ts` | proof route uses proxy; mock fallback TXODDS_MOCK only |
| `contracts` | `source: txline|mock`, optional `txSig`, `explorerUrl` |
| `SettlementProofPanel.tsx` | badge source + lien explorer |

### Phase P3 — pi_model

**Features pre-enregistrees** (constants AUDIT) :

1. Score diff aligned with selection
2. Minute proxy = max(events[].minute) ou 0
3. Odds momentum = implied - openImplied for matching selection line

| Module | Changement |
|--------|------------|
| `config.ts` | MODEL_* coefficients |
| `consensus.ts` | `modelProbFromFeatures` rewrite |
| `natt_edge.ts` | pass lines + events to model |
| `consensus.test.ts` | unit + property tests |

## 4. Design by Contract (DbC)

| Element | Detail |
|---------|--------|
| Niveau DbC | DEV |
| PRE | fixtureId string; lines OddsLine[] pour edge |
| POST | odds map : implied in [0,1]; proof : source enum; edge : verdict in SETUP,HOLD |
| INV | combine output in (0,1); fail-closed HOLD sans odds |
| Erreurs | txline 502 upstream; proof 404 si pas de scores |

## 5. Properties (vitest + fast-check option)

| PROP | Enonce |
|------|--------|
| PROP-1 | forall pi_tx,pi_model in (0.05,0.95): c in (0,1) |
| PROP-2 | edge_score = c - pi_tx |
| PROP-3 | empty lines => HOLD |

Mutation : **WAIVE** — hackathon L2, pas mutmut TS scope.

## 6. Endpoints delta

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/fixtures/:id/odds/debug` | DEV: raw TxLINE odds shape (ODDS_DEBUG=true) |
| GET | `/v1/fixtures/:id/proof` | TxLINE stat-validation mapped; `source` field |

## 7. Deploy

Services : `natt-pundit-gateway`, `natt-pundit-edge-api`, `natt-pundit-web` (unchanged compose).
