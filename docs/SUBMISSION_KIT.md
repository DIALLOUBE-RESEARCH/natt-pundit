# Natt Settlement — Submission kit (F68N + F71/F72/F73/F75)

**Track:** TxODDS World Cup — Prediction Markets & Settlement (Superteam Solana ecosystem partner track via TxODDS hackathon).

**Deadline:** 2026-07-19

**Pre-submit:** [`SUBMISSION_CHECKLIST.md`](./SUBMISSION_CHECKLIST.md) · Form copy-paste: [`SUBMISSION_FORM_READY.md`](./SUBMISSION_FORM_READY.md)

**Docs:** start with [`QUICKSTART_JURY.md`](./QUICKSTART_JURY.md) → [`USER_GUIDE.md`](./USER_GUIDE.md) → [`TXLINE_SETTLEMENT.md`](./TXLINE_SETTLEMENT.md) → this file (smoke curls).

### Superteam Earn — short description (copy-paste)

Natt Settlement turns TxLINE World Cup data into trustless Solana prediction-market settlement on **devnet USDC** (demo — not real money). TxLINE streams odds and publishes Merkle match-result proofs; our Anchor escrow CPI-validates via `validate_stat` (fail-closed); a permissionless keeper settles finished pools; users alone sign deposit and claim. Live app + MCP agents + public repo.

## Live URLs

| Resource | URL |
|----------|-----|
| App (English UI) | https://hypernatt.com/fr/nattpundit?lang=en |
| In-app docs (8 langs) | https://hypernatt.com/fr/nattpundit?lang=en&tab=docs |
| Other locales | add `?lang=fr` / `es` / `de` / etc. |
| **Data Lab** | https://hypernatt.com/fr/nattpundit/datas?lang=en |
| Gateway health | https://hypernatt.com/api/natt-pundit/txline/health |
| Edge health | https://hypernatt.com/api/natt-pundit/edge/health |
| MCP health | https://hypernatt.com/mcp-pundit/health |
| MCP manifest | https://hypernatt.com/mcp-pundit/pundit/info |
| Example proof (Merkle) | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof |
| Proof verify | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify |
| Edge board | https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary |
| CLV verdict | https://hypernatt.com/api/natt-pundit/edge/v1/data/clv |
| **Escrow CPI args (devnet)** | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18209181/cpi-args?outcome=home |
| CPI regulation tie (optional) | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/cpi-args?outcome=draw |
| Natt escrow program (devnet) | `GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD` |

## Escrow devnet demo (F71N + F75N refund)

| Layer | Network |
|-------|---------|
| Fixtures, edge, Merkle proof | mainnet TxLINE |
| USDC pool + CPI settle + refund | **devnet** (Reown AppKit / WalletConnect signs) |

**Wallet stack (Solana, not wagmi):** Reown AppKit + `@reown/appkit-adapter-solana` — Phantom, Solflare, WalletConnect mobile; custom Phantom deeplink on mobile Chrome/Safari. **Fans:** sign deposit (+ optional pool create) and **claim** only — post-match **settle** is done by the **escrow keeper** (VPS fee payer). **Agents (MCP):** may also call settle/claim/refund tools. Sign-In With Solana for Data Lab export.

**i18n + theme (jury UX):** **8 languages** (en, fr, es, zh, ja, ru, pt, de) on the full fan path — fixtures, match detail, bet slip, wallet, in-app docs, agent connect. **Light/dark** Stitch glass toggle (top-left) with Reown modal theme sync and night stadium card art.

**Pool modes** (pure fn of `side_totals`):

- **Solo side** (≤1 country backed): after kickoff → `refund()` 100%, no settle.
- **Shared pool** (≥2 countries backed): **keeper** permissionless `settle` on-chain, then fan **claim** pro-rata.

Smoke CPI args (canonical jury fixture — France–Morocco FT 2–0):

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18209181/cpi-args?outcome=home"
```

Expect **200**. (Fixture `18172280` is 1–1 + pens: use `?outcome=draw` for regulation CPI, not `home` — see [`TXLINE_FEEDBACK.md`](./TXLINE_FEEDBACK.md).)

## MCP + x402 (F72N)

**20 tools** — canonical list: `services/mcp/server-card.json`

```bash
curl -sf https://hypernatt.com/mcp-pundit/health
curl -sf https://hypernatt.com/mcp-pundit/pundit/info
```

Cursor: add `"url": "https://hypernatt.com/mcp-pundit/protocol"` in MCP settings.

Paid reads: **$0.01 USDC** Solana devnet (intro-free + optional env wallet bypass). **Separate** from escrow SPL deposits.

## Agent autonome (F73N / F74N)

**Guide complet :** [`AUTONOMOUS_AGENT_CDP.md`](./AUTONOMOUS_AGENT_CDP.md)

| Piece | Detail |
|-------|--------|
| Demo dashboard | https://hypernatt.com/fr/nattpundit/agent |
| Wallet | Coinbase **CDP Server Wallet** (Solana devnet) — no private key on Natt VPS |
| Script | `scripts/natt-agent-cdp-autonomous.mjs` |
| Alt dev | `scripts/natt-agent-autonomous.mjs` + `AGENT_WALLET_SECRET` |

### Quick start (CDP)

1. [CDP portal](https://portal.cdp.coinbase.com/) → API keys + Wallet Secret.
2. Fund agent address (SOL + USDC devnet).
3. Run:

```bash
node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <FIXTURE_ID> --outcome home
```

### Docker (VPS)

```bash
docker run --rm -v ~/HYPERNATT/hackathon/natt-pundit:/app -w /app \
  --env-file ~/HYPERNATT/.env \
  -e NATT_PUNDIT_CDP_SOLANA_ADDRESS=<agent-pubkey> \
  node:22-alpine node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <ID>
```

Flow: create pool → deposit → poll → refund/settle/claim until `done`.

In-app (8 langs): Docs tab → **Autonomous agent (CDP wallet)**.

## Endpoints (smoke)

```bash
# Merkle proof + validated flag
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof

# Verify only
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify

# SETUP/HOLD board (cap 20)
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary

# CLV harness (honest N / bootstrap CI)
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/data/clv

# Single match edge
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/edge/18175397/verdict

# Direct ZIP export is FORBIDDEN in prod (403) — use Data Lab SIWS button
curl -s -o /dev/null -w "%{http_code}\n" \
  https://hypernatt.com/api/natt-pundit/edge/v1/data/export
```

## 5-minute video script outline

1. **0:00–0:30** — Problem: prediction markets need verifiable settlement + honest edge, not vibes.
2. **0:30–1:15** — Live app: fixture grid, SETUP/HOLD, match detail decomposition 1X2.
3. **1:15–2:00** — **Data Lab** `/datas`: CLV progress bar, `CLV_VERIFIED` rare by design (N≥500).
4. **2:00–2:45** — Settlement panel: Merkle path, green badge (`validated=true`) on finished fixture.
5. **2:45–3:30** — **Escrow devnet (fan UX)**: connect Phantom → **Place bet** (one CTA pre-kickoff; **up to two** approvals if the on-chain pool must be created first) → after FT **Settlement in progress…** (keeper auto-settles) → **Collect payout** (**one** claim signature). Optional: unmatched **refund** after kickoff.
6. **3:30–4:15** — **MCP agent**: Cursor `natt-pundit` server → `get_fixture_agent_status` → unsigned deposit/refund tx; mention x402 ≠ escrow deposit.
7. **4:15–4:45** — Architecture slide: web → gateway/edge/MCP → TxLINE; devnet escrow; `natt-core` tests.
8. **4:45–5:00** — CTA: public mirror, TxLINE activate, deadline 2026-07-19.

**Finished match (proof):** fixture `18172280` (Merkle verify). **Escrow CPI settle demo:** fixture `18209181` outcome=home (FT 2–0). **Refund demo:** solo deposit post-kickoff → recover stake.

## What we prove

- **Prediction**: SETUP/HOLD from two-source combine vs Shin consensus (fail-closed without odds).
- **Research**: CLV harness with bootstrap CI — badge only when statistically earned.
- **Settlement**: Off-chain Merkle verify + on-chain CPI settle (devnet).
- **Agents**: MCP 20 tools + autonomous escrow loop (unsigned tx pattern) + read-only dashboard `/agent`.

## Repo sync (public mirror)

```powershell
.\hackathon\natt-pundit\scripts\sync-public-github.ps1 -Push
```

Requires `gh` auth to `DIALLOUBE-RESEARCH/natt-pundit`.

## Jury Q&A (prep)

| Question | Short answer |
|----------|----------------|
| Who decides the match result? | **TxLINE** Merkle proof + on-chain CPI `validate_stat`. Our backend does not pick scores. |
| Is this real-money gambling? | **No** — Solana **devnet** demo USDC only; research / settlement-engine showcase for the TxODDS track. |
| Why USDC and not TxLINE token? | Track rules: no TxLINE token for P2P wagering. We use Circle devnet USDC in escrow. |
| Can you steal user funds? | **No custody.** Fans sign deposit/claim. Keeper signs permissionless `settle` only (fee payer). F79N submit whitelist blocks arbitrary SPL drains. |
| What if TxLINE has no proof? | **Fail-closed:** no settle, `refund_all` / solo `refund` paths; no payout on unproven data. |
| Why is SETUP/HOLD not open source? | Proprietary edge engine; settlement is independent. Jury can verify CPI + pool math + CLV harness in public repo. |
| Single deployer key on Anchor? | Devnet iteration only; documented — production would use multisig (see README limitations). |

## Contact

HyperNatt / NATTAPP — see [`README.md`](../README.md).
