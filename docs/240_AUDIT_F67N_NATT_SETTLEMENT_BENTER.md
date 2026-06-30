# 240 — AUDIT F67N Natt Settlement (Benter edge doctrine)

> **Statut** : AUDIT — GO SPEC (owner implicit hackathon pipeline).
> **Skill ref** : nattapp-work-method SS1 AUDIT + Mathematical Truth gate
> **Niveau assurance** : **L2-L3** (edge gate touches capital-adjacent SETUP verdict; pure math in natt-core)

## 1. Perimetre

| Champ | Valeur |
|-------|--------|
| Projet | hackathon/natt-pundit — Prediction Markets track |
| Feature | F67N — live odds, TxLINE proofs, pi_model (Benter combine) |
| Hors-scope | Hypernatt prod, PolyMimo, 3D/mobile, public API names with internal doctrine label |
| Risque bug silencieux | **critique** — empty odds => HOLD masque edge; mock proof => faux settlement UX |

## 2. Etat actuel PROUVE (2026-06-30 UTC)

| Mesure | Commande / source | Resultat |
|--------|---------------------|----------|
| Gateway health | `curl https://hypernatt.com/api/natt-pundit/txline/health` | `mock=false`, `hasToken=true` |
| Fixture count prod | `GET /v1/fixtures` | **14** fixtures, `source=txline`, WC competition |
| Odds scheduled | `GET /v1/fixtures/18175397/odds` | **3 lines** 1X2 (home/draw/away), implied > 0 |
| Odds finished | `GET /v1/fixtures/18172280/odds` | **[]** — snapshot vide post-match (attendu TxLINE) |
| Edge verdict | `GET /edge/v1/edge/18175397/verdict` | HOLD, `pi_tx=0.271`, `pi_model=pi_tx` (stub 0-0), `c` combine actif |
| Proof | `GET /v1/fixtures/18175397/proof` | **mock** (`0xmock_root_*`) — P2 blocker |
| Mock bundle local | `fixtures/wc_live_match.json` | odds + scores OK pour dev |
| pi_model prod | edge-api | **stub** — pas de momentum/minute pre-enregistre |

**HYPOTHESE** (a falsifier P1) : mapOdds filtre trop strict si `Pct` vide et `Prices` seuls — fallback Prices a ajouter.

## 3. Benter math (internal doctrine — pas dans noms API publics)

| Symbole | Definition |
|---------|------------|
| pi_tx | Shin de-vig consensus from TxLINE **full-time 1X2** (`1X2_PARTICIPANT_RESULT`, `MarketPeriod` null) |
| pi_model | Natt private model on **pre-registered** live features only |
| c | `invLogit(alpha*logit(pi_tx) + beta*logit(pi_model))` |
| SETUP | iff `c - pi_tx > epsilon_net` (EPSILON_NET pre-enregistre config.ts) |
| HOLD | fail-closed si odds vides, edge <= epsilon, ou donnees invalides |

**Constantes pre-enregistrees (P3, ne pas tuner apres data)** :

| Constante | Valeur initiale | Role |
|-----------|-----------------|------|
| EPSILON_NET | 0.03 | gate SETUP |
| COMBINE_ALPHA | 1 | poids logit pi_tx |
| COMBINE_BETA | 1 | poids logit pi_model |
| MODEL_SCORE_COEF | 0.04 | ajustement par but d'ecart (selection-aligned) |
| MODEL_MOMENTUM_COEF | 0.12 | delta implied vs openImplied |
| MODEL_MINUTE_COEF | 0.002 | proxy minute depuis events (max minute) |
| MODEL_DRAW_TIE_BONUS | 0.02 | draw quand |score diff| < 0.5 |
| MODEL_MAX_ADJ | 0.10 | cap absolu sur ajustement vs baseImplied |

## 4. Gate Mathematical Truth (L2-L3 edge)

| Question | Reponse |
|----------|---------|
| Echantillon / EPV suffisant ? | Hackathon : N fixtures WC live; gate jury = **>=1 fixture scheduled avec odds non vides** + verdict calculable (pi_tx>0). Pas de claim ROI. |
| Metrique honnete ? | **edge_score = c - pi_tx** net de combine; pas accuracy ML. HOLD explicite si pas de cotes. |
| Anti-illusion ? | Constantes **pre-enregistrees** dans AUDIT avant code P3; epsilon non tune post-hoc; finished match odds vide documente. |
| Verdict falsifiable ? | P1 PASS si odds non vides sur fixture scheduled; P2 PASS si `source=txline`; P3 PASS si tests unit+property verts; SETUP prod depend edge reel > 0.03. |

## 5. Invariants candidats

| ID | Invariant | Type |
|----|-----------|------|
| INV-1 | `0 < c < 1` quand pi_tx et pi_model dans (0,1) | INV |
| INV-2 | odds vides => verdict HOLD, pi_tx=0 | POST |
| INV-3 | pi_tx = Shin(home,draw?,away) sur marche FT 1X2 | POST |
| INV-4 | proof mock uniquement si TXODDS_MOCK=true ou pas de token | POST |
| PRE-1 | fixtureId numerique TxLINE pour proof proxy | PRE |

## 6. Risques

- Finished fixtures sans odds => HOLD permanent (acceptable; documenter UI).
- stat-validation necessite `seq` valide — extraction depuis scores snapshot fragile.
- pi_model heuristique — pas ML; SETUP rare si consensus fort (voulu).

## 7. Verdict audit

**GO SPEC** — P1 odds partiellement OK prod; P2 mock proof a remplacer; P3 stub a enrichir.
