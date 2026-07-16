# Quickstart — 5 minutes

**Track:** TxODDS World Cup — Prediction Markets & Settlement  
**Live app (English UI):** https://hypernatt.com/fr/nattpundit?lang=en

Read this first, then [`USER_GUIDE.md`](./USER_GUIDE.md) (betting + wallet), [`TXLINE_SETTLEMENT.md`](./TXLINE_SETTLEMENT.md) (CPI / Merkle), [`JURY_VERIFICATION.md`](./JURY_VERIFICATION.md) (on-chain explorer links), and [`SUBMISSION_KIT.md`](./SUBMISSION_KIT.md) (curl smoke).

---

## 1. Open the product (30 s)

| What | URL |
|------|-----|
| App | https://hypernatt.com/fr/nattpundit?lang=en |
| **User manual (8 langs)** | https://hypernatt.com/fr/nattpundit?lang=en&tab=docs |
| Wallet + bet history | https://hypernatt.com/fr/nattpundit?lang=en&tab=wallet |
| Data Lab | https://hypernatt.com/fr/nattpundit/datas?lang=en |
| Agent dashboard (read-only) | https://hypernatt.com/fr/nattpundit/agent?lang=en |
| MCP manifest (GET) | https://hypernatt.com/mcp-pundit/pundit/info |

Change language in the header — Docs tab follows (**en, fr, es, de, pt, ru, ja, zh**).

**Also try:** sun/moon toggle (top-left) for **light/dark** Stitch theme — wallet modal syncs.

---

## 2. Smoke APIs (1 min)

```bash
curl -sf https://hypernatt.com/api/natt-pundit/txline/health
curl -sf https://hypernatt.com/api/natt-pundit/edge/health
curl -sf https://hypernatt.com/mcp-pundit/health
curl -sf https://hypernatt.com/mcp-pundit/pundit/info
# escrow keeper (internal compose — jury: trust README + fan UX on live app)
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary | head -c 400
```

Merkle proof (example fixture):

```bash
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify
```

CPI settle args (canonical demo — FT win):

```bash
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18209181/cpi-args?outcome=home
```

---

## 3. Devnet escrow demo (2 min)

**Not real money** — Solana Devnet USDC + SOL only.

| Step | Action |
|------|--------|
| Fund | [SOL faucet](https://faucet.solana.com/) + [USDC faucet](https://faucet.circle.com/) (Solana Devnet) |
| Connect | App header → **Wallet** pill → Reown modal (Phantom, Solflare, WalletConnect mobile) |
| Bet | Match page → pick side + stake → **Place bet** (≥ 0.01 USDC, pre-kickoff). First bet on a new on-chain pool: up to **two** approvals (create pool + deposit). |
| After FT | **Settlement in progress…** (escrow keeper auto-settles pool) → **Collect payout** — **one signature** (claim only) |
| Archived match | **Wallet tab** → **Collect payout** / **Refund stake** on each row |

Pool modes: **Shared pool** (2+ countries backed) → collect after FT · **Solo side** (one country only) → refund after kickoff.

---

## 4. Connect an AI agent (1 min)

**MCP URL:** `https://hypernatt.com/mcp-pundit/protocol` — **20 tools** (HTTP streamable — not on Smithery)

| Client | How |
|--------|-----|
| **Cursor** | App → **Connect Agent** → Cursor, or see [`CURSOR_NATT_PUNDIT_MCP.md`](./CURSOR_NATT_PUNDIT_MCP.md) |
| **Claude.ai** | Connectors → custom → Name `Natt Pundit`, URL above, OAuth empty |
| **Claude Code** | `claude mcp add --scope user --transport http natt-pundit https://hypernatt.com/mcp-pundit/protocol` |
| **Other** | Connect Agent → Other → copy JSON or URL |

First tool call: **`get_pundit_manifest`**

**Autonomous agent (CDP):** [`AUTONOMOUS_AGENT_CDP.md`](./AUTONOMOUS_AGENT_CDP.md) — reproduce our betting agent with Coinbase Server Wallet + `natt-agent-cdp-autonomous.mjs`.

x402: some reads cost $0.01 devnet USDC (separate from escrow deposits). Hackathon VPS may have `devnet_open_access` enabled.

---

## 5. What to look for (checklist)

- [ ] SETUP/HOLD badges on fixtures (edge ≠ blind tips)
- [ ] **8 languages** — switch header or `?lang=fr` ; Docs tab translated
- [ ] **Light/dark mode** — sun/moon toggle top-left ; Reown modal follows
- [ ] **Wallet connect** — Reown AppKit + WalletConnect; sign deposit → collect on devnet
- [ ] Merkle proof panel on finished matches
- [ ] **Fan bet slip** — Place bet (pre-kickoff) → after FT **Settlement in progress…** → **Collect payout** (1 claim signature; keeper auto-settles pool)
- [ ] Wallet tab: balances + bet history + claim from archived fixtures
- [ ] Docs tab in your language (faucets, MCP, betting, GitHub link)
- [ ] MCP health + manifest + agent connect modal
- [ ] **Autonomous agent** — `/agent` dashboard + [`AUTONOMOUS_AGENT_CDP.md`](./AUTONOMOUS_AGENT_CDP.md)

---

## Doc map

| File | Audience |
|------|----------|
| [`QUICKSTART_JURY.md`](./QUICKSTART_JURY.md) | This page — 5 min orientation |
| [`USER_GUIDE.md`](./USER_GUIDE.md) | End-user: wallet, bet, claim, MCP |
| [`AUTONOMOUS_AGENT_CDP.md`](./AUTONOMOUS_AGENT_CDP.md) | CDP Server Wallet + autonomous betting loop |
| [`SUBMISSION_KIT.md`](./SUBMISSION_KIT.md) | Full smoke curls + agent autonomous script |
| [`CURSOR_NATT_PUNDIT_MCP.md`](./CURSOR_NATT_PUNDIT_MCP.md) | Cursor / MCP config detail |
| [README](../README.md) | Architecture + limitations |
