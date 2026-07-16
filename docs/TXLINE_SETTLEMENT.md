# TxLINE settlement — technical reference (jury)

**Track:** Prediction Markets & Settlement (TxODDS World Cup / Superteam).

This document is the **single-page** explanation of how Natt Settlement binds TxLINE match results to Solana escrow payouts. For curls and smoke URLs see [`SUBMISSION_KIT.md`](./SUBMISSION_KIT.md).

---

## 1. Trust model (one sentence)

**TxLINE** publishes a cryptographic stat-validation proof; our **gateway** verifies it off-chain; the **Anchor escrow** CPI-calls TxLINE `validate_stat` on-chain; only then can a pool be marked `settled` and winners **claim** USDC.

Natt servers **never** choose the score. They relay proofs and (for fans) run a **permissionless settle keeper** that pays devnet tx fees only.

---

## 2. Network split

| Layer | Network | Role |
|-------|---------|------|
| Fixtures, live odds, Merkle proofs | TxLINE (mainnet API) | Data + proof source |
| Escrow pools, USDC SPL | **Solana devnet** | Demo funds only |
| Escrow program | devnet `GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD` | CPI + parimutuel |

**Not real money.** Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.

---

## 3. End-to-end flow

```
TxLINE API
    |  fixtures / odds / finished stats
    v
txline-gateway  (/proof, /proof/verify, /cpi-args)
    |  local Merkle recompute (fail if mismatch)
    v
Off-chain UI badge  (validated=true on match page)
    |
    v
settle transaction
    |  embeds TxLINE validate_stat ix (from /cpi-args)
    v
natt_escrow::settle  -->  CPI validate_stat  -->  winning_side on-chain
    |
    v
User claim (SPL transfer)  OR  refund() if solo-side / void
```

**Fail-closed:** if CPI `validate_stat` returns false, `settled` stays false and no winner payout path opens.

---

## 4. HTTP API (production)

Base: `https://hypernatt.com/api/natt-pundit/txline`

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Gateway up |
| `GET /v1/fixtures` | WC fixture list |
| `GET /v1/fixtures/:id/proof` | Merkle leaf + path for settlement stats |
| `GET /v1/fixtures/:id/proof/verify` | Local recompute; `validated: true/false` |
| `GET /v1/fixtures/:id/cpi-args?outcome=home\|draw\|away` | Serialized TxLINE ix + metadata for `settle` |

### Example fixtures (finished)

| Demo | Fixture | Curl |
|------|---------|------|
| Merkle proof + verify | `18172280` | `.../18172280/proof/verify` → `valid:true` |
| CPI settle (FT win) | `18209181` (2–0) | `.../18209181/cpi-args?outcome=home` → **200** |
| CPI regulation tie only | `18172280` (1–1 + pens) | `.../18172280/cpi-args?outcome=draw` → **200** |

```bash
# Merkle (any finished fixture with proof)
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify

# CPI settle — canonical jury demo (France–Morocco FT 2–0)
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18209181/cpi-args?outcome=home
```

404/502 on `cpi-args` means TxLINE has no provable stat sequence for that **outcome** (e.g. `home` on a 1–1 + pens match) — pool stays unsettled; `refund_all` applies. See [`TXLINE_FEEDBACK.md`](./TXLINE_FEEDBACK.md).

---

## 5. On-chain program

| Item | Value |
|------|-------|
| Program id (devnet) | `GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD` |
| Source | [`../solana-escrow/`](../solana-escrow/) (mirrored in public repo) |
| Key instructions | `create_pool`, `deposit`, `settle`, `claim`, `refund`, `refund_all` |
| Settlement rule | `winning_side` derived from CPI — **no client-supplied winner** (F95N removed `settle_knockout_tab`) |

Settle sequence (simplified):

1. Client GET `/cpi-args?outcome=…`
2. Build `natt_escrow::settle` tx with embedded TxLINE ix bytes
3. Broadcast (fan app: **escrow keeper**; MCP agent: wallet signs)
4. Winners call `claim` (user-signed SPL transfer)

Local smoke (developer machine with TxLINE token):

```bash
cd hackathon/solana-escrow
npx tsx scripts/smoke_view_validate.ts --fixture 18172280 --outcome home
```

---

## 6. Fan vs agent signing

| Actor | Signs | Does NOT sign |
|-------|-------|----------------|
| **Fan (web app)** | `deposit`, `claim`, `refund` | `settle` (keeper broadcasts) |
| **Escrow keeper (VPS)** | `settle` ix only | `claim`, `refund`, `deposit` |
| **MCP / CDP agent** | full loop including `settle` if autonomous | N/A |

Keeper: [`services/escrow-keeper/README.md`](../services/escrow-keeper/README.md).

---

## 7. Pool modes (on-chain)

Pure function of `side_totals` — see `packages/natt-core/src/escrow_pool_mode.ts`.

| Mode | Condition | After kickoff / FT |
|------|-----------|-------------------|
| Solo side | <=1 funded outcome | `refund()` 100% |
| Shared pool | >=2 funded outcomes | CPI settle + pro-rata `claim` |

---

## 8. Compliance notes (hackathon)

- **No TxLINE token** used as wager currency — **USDC SPL** only (track rules).
- **Devnet demo** — not a licensed sportsbook; research / settlement-engine showcase.
- **SETUP/HOLD** edge is analytical guidance; settlement does not depend on edge verdict.

---

## 9. Further reading

| Doc | Content |
|-----|---------|
| [`SUBMISSION_KIT.md`](./SUBMISSION_KIT.md) | All smoke curls + video outline |
| [`SECURITY.md`](../SECURITY.md) | Escrow threat model + CPI binding |
| [`../solana-escrow/SECURITY.md`](../solana-escrow/SECURITY.md) | Anchor program audit notes |
| [TxLINE WC docs](https://txline.txodds.com/documentation/worldcup) | Official oracle documentation |
