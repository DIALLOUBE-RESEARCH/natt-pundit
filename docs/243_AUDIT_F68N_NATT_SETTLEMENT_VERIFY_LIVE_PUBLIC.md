# 243 — AUDIT F68N Natt Settlement verify live public

> **Statut** : AUDIT — GO SPEC (owner hackathon pipeline F68N).
> **Skill ref** : nattapp-work-method SS1 AUDIT + Mathematical Truth gate
> **Niveau assurance** : **L2** (Merkle verify pure + edge board read-only)

## 1. Perimetre

| Champ | Valeur |
|-------|--------|
| Projet | hackathon/natt-pundit — Prediction Markets & Settlement |
| Feature | F68N — Merkle verify live, SETUP board public, submission kit |
| Pre-requis | F67N P1-P3 livre (odds, proof proxy, pi_model) |
| Hors-scope | Hypernatt prod, PolyMimo, on-chain validate_stat write |

## 2. Etat actuel PROUVE (2026-06-30 UTC)

| Mesure | Source | Resultat |
|--------|--------|----------|
| Proof txline | `GET .../18172280/proof` | `source=txline`, `validated=false` (pre-F68N) |
| Stat-validation raw | VPS TxLINE API | statProof 6 nodes, subTree 1, main 2 |
| Merkle L1 | scoreStatLeaf + statProof | -> eventStatRoot **PASS** |
| Merkle L2 | eventStatRoot + subTreeProof | -> summaryRoot **PASS** |
| Edge verdict | `GET .../18175397/verdict` | HOLD, pi_tx>0 |
| Fixtures prod | gateway | 14 WC fixtures |
| Public README | hackathon README | stub Merkle mention |

## 3. Two-source logit combine (internal doctrine)

| Symbole | Definition |
|---------|------------|
| pi_tx | Shin de-vig TxLINE FT 1X2 |
| pi_model | Pre-registered live features (MODEL_* config.ts) |
| c | invLogit(alpha*logit(pi_tx) + beta*logit(pi_model)) |
| SETUP | iff c - pi_tx > EPSILON_NET (0.03, fixed) |

**No post-hoc tuning** of MODEL_* or EPSILON_NET after this AUDIT.

## 4. Gate Mathematical Truth

| Question | Reponse |
|----------|---------|
| Echantillon | Hackathon jury: >=1 fixture avec odds + >=1 proof txline verifiable |
| Metrique honnete | edge_score = c - pi_tx; Merkle = inclusion path not accuracy |
| Anti-illusion | Test vector fixture 18172280 hardcoded; epsilon fixed |
| Verdict falsifiable | P4 PASS si validated=true on finished fixture; P5 PASS si summary items>0 |

## 5. Invariants

| ID | Invariant |
|----|-----------|
| INV-M1 | verifyMerklePath deterministic SHA-256 sibling order |
| INV-M2 | mock proof => validated=false |
| INV-E1 | empty odds => HOLD in summary |
| POST-M1 | validated=true only after local verifyTxlineSettlementProof |

## 6. Verdict audit

**GO SPEC** — Merkle L1-L2 prouves sur prod vector; board + public kit manquants.
