# 244 — SPEC F68N Natt Settlement verify live public

> **Statut** : SPEC — GO TASK.
> **Audit** : `243_AUDIT_F68N_NATT_SETTLEMENT_VERIFY_LIVE_PUBLIC.md`
> **Skill ref** : nattapp-work-method SS2 SPEC

## 1. Objectifs falsifiables

| ID | Objectif | Gate PASS |
|----|----------|-----------|
| P4 | Merkle verify off-chain | `validated=true` on fixture 18172280 prod; unit tests vert |
| P5 | Live SETUP board | `GET /v1/edge/summary` items>0; MatchCard badge; sort SETUP first |
| P6 | Jury public kit | README + SUBMISSION_KIT.md + sync script |

## 2. Hors-scope

- On-chain validate_stat transaction
- ML / retune MODEL_*
- Public API name "benter"

## 3. Phase P4 — Merkle verification

| Module | Changement |
|--------|------------|
| `natt-core/merkle_verify.ts` | scoreStatLeafHash, verifyMerklePath, verifyTxlineSettlementProof |
| `merkle_verify.test.ts` | vector fixture 18172280 |
| `txlineProof.ts` | run verify after stat-validation; set validated |
| `txline-gateway/index.ts` | `GET /v1/fixtures/:id/proof/verify` |
| `SettlementProofPanel.tsx` | green badge when validated |

**TxLINE levels** :
1. stat leaf (borsh ScoreStat) + statProof -> eventStatRoot
2. eventStatRoot + subTreeProof -> summarySubTreeRoot
3. mainTreeProof terminal hash == merkleRoot + structural verify

## 4. Phase P5 — Live edge board

| Module | Changement |
|--------|------------|
| `edge-api/index.ts` | `GET /v1/edge/summary` cap 20 parallel |
| `contracts` | EdgeSummarySchema |
| `MatchCard.tsx` | optional edge prop + EdgeBadge |
| `index.tsx` | fetch summary, merge, sort SETUP > live > scheduled |

## 5. Phase P6 — Public jury

| Deliverable | Content |
|-------------|---------|
| README.md | track, live URL, two-source logit math |
| SUBMISSION_KIT.md | URLs, endpoints, video outline, Superteam track |
| sync-public-github.ps1 | exclude PUBLIC_REPO_SYNC.md |

## 6. DbC (DEV)

| PRE | fixtureId numeric; proof nodes with isRightSibling |
| POST | validated boolean; summary items match EdgeVerdict shape |
| INV | mock => validated false |

Property / mutation : **WAIVE** — hackathon L2 TS.

## 7. Endpoints delta

| Method | Path | Service |
|--------|------|---------|
| GET | `/v1/fixtures/:id/proof/verify` | txline-gateway |
| GET | `/v1/edge/summary` | edge-api |

## 8. Deploy

`natt-pundit-gateway`, `natt-pundit-edge-api`, `natt-pundit-web` + nginx restart.
