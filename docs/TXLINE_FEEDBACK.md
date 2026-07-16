# TxLINE API — team feedback (hackathon submission)

**Project:** Natt Settlement (Natt Pundit)  
**Track:** Prediction Markets & Settlement (TxODDS World Cup / Superteam)  
**Date:** 2026-07-16

---

## What worked well

1. **Normalised schema** — fixtures snapshot + odds snapshot share a predictable JSON shape. We scaled from a single match view to a full tournament board without custom parsers per competition.

2. **`stat-validation` Merkle proofs** — the strongest primitive for this track. We recompute SHA-256 paths off-chain (`proof/verify`), then CPI `validate_stat` on Solana devnet escrow. Judges can verify without trusting our backend score.

3. **Guest auth + token activate** — straightforward for a hackathon VPS proxy (`/auth/guest/start`, `/api/token/activate`). Our gateway hides secrets from the browser.

4. **SSE score updates** — `GET /api/scores/updates/{fixtureId}` is the right primitive for live UI + keeper timing. We backfill from snapshot when SSE is quiet.

5. **Hackathon data access** — zero commercial friction until 2026-07-19 made it possible to ship a real settlement demo, not mocks.

---

## Friction and gaps (honest)

### 1. Knockout matches decided on penalties (high impact)

**Fixture example:** `18176123` (Australia–Egypt), `18172280` (regulation 1–1, pens 2–3).

- UI scores show regulation + `penScore`.
- `stat-validation` Merkle trees for **goals** (stats 1002/1003) often index regulation scores only — not the shootout winner as a first-class CPI target.
- Our escrow is **fail-closed**: if TxLINE cannot prove the outcome on-chain, we **do not settle** — pools go to `refund_all` / solo `refund`.

**Ask:** document which stat keys / validation sequences cover **penalty shootout winner** for knockout fixtures, or expose a dedicated validation primitive for TAB outcomes.

### 2. CPI args vs proof verify (jury confusion)

- `GET .../fixtures/18172280/proof/verify` → **`valid: true`** (Merkle path OK).
- `GET .../fixtures/18172280/cpi-args?outcome=home` → **502** (no on-chain proof for that outcome on a 1–1 + pens match).
- `GET .../fixtures/18172280/cpi-args?outcome=draw` → **200** (regulation tie provable).
- `GET .../fixtures/18209181/cpi-args?outcome=home` → **200** (standard FT win — **recommended jury demo**).

**Ask:** in World Cup docs, clarify which `outcome` values are provable per match phase (regulation vs TAB winner).

### 3. Stat key numbering

We map participant1/home via `Participant1IsHome` and support legacy keys (1002/1003) vs newer keys (1/2). A single table in WC docs (“goals home/away key ids by API version”) would reduce integration time.

### 4. Post-match odds snapshot

Finished fixtures sometimes return empty odds arrays — expected, but UI should document “odds snapshot is pre-match oriented” so builders do not treat `[]` as an outage.

### 5. Rate limits / seq scan

Building CPI args may scan multiple `seq` values on `stat-validation`. A `recommendedSeq` or `latestValidatedSeq` field in the proof payload would cut gateway latency and failed probes.

---

## Fixtures we used for demos (reproducible)

| Fixture ID | Match | Use in demo |
|------------|-------|-------------|
| `18209181` | France–Morocco FT **2–0** | **CPI settle** `?outcome=home` (200) |
| `18172280` | Regulation **1–1** + pens | **Merkle verify** + CPI `?outcome=draw` only |
| `18176123` | AUS–EGY TAB | Documented **fail-closed** refund (TxLINE Merkle gap) |

---

## One-line summary for sponsors

TxLINE is production-grade for feeds and Merkle settlement proofs; the biggest builder gap for prediction markets is **knockout / penalty-winner CPI coverage** — we worked around it with fail-closed refunds and clear jury docs.
