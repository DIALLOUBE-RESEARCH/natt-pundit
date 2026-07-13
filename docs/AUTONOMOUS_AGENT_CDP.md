# Autonomous agent — CDP Server Wallet + MCP (F73N / F74N)

**Audience:** hackathon jury, developers reproducing our agent betting loop.

**Live demo (read-only):** https://hypernatt.com/fr/nattpundit/agent?lang=en

**MCP manifest (browser GET):** https://hypernatt.com/mcp-pundit/pundit/info

---

## Fan vs agent (two paths)

| Path | Who signs | How |
|------|-----------|-----|
| **Fan** | Human | Phantom / Solflare / WalletConnect in the PWA |
| **Agent** | Your bot | MCP tools → **unsigned** txs → **your** Solana wallet signs → `submit_signed_escrow_tx` |

Natt servers **never** hold user or agent private keys. MCP returns unsigned transactions only.

---

## Architecture

```
Cursor / Claude / script
        │  MCP streamable HTTP (POST /mcp-pundit/protocol)
        ▼
   20 tools (edge, pool, build_deposit_tx, build_claim_tx, …)
        │  unsigned Solana tx (base64)
        ▼
   CDP Server Wallet  OR  local keypair
        │  sign
        ▼
   submit_signed_escrow_tx → Solana devnet escrow program
```

---

## Option A — CDP Server Wallet (our production stack)

Uses [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) Server Wallet — signing via CDP API (TEE), no private key export.

### 1. CDP setup

1. Create a CDP project → API keys.
2. Create **Wallet Secret** (`CDP_WALLET_SECRET`).
3. On first script run, a Solana devnet account is created (`natt-pundit-agent`) or reuse with `NATT_PUNDIT_CDP_SOLANA_ADDRESS`.

### 2. Environment variables

```bash
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
# optional after first create:
NATT_PUNDIT_CDP_SOLANA_ADDRESS=...
NATT_PUNDIT_MCP_URL=https://hypernatt.com/mcp-pundit/protocol
```

**Never commit** these values. Use `.env` locally or VPS `~/HYPERNATT/.env` only.

### 3. Fund devnet (SOL + USDC)

- Public faucets: [SOL](https://faucet.solana.com/) · [USDC](https://faucet.circle.com/) (Solana Devnet) → paste agent address.
- Or CDP faucet helper: `node scripts/_fund-cdp-agent-devnet.mjs` (requires CDP env above).

USDC mint (devnet): `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

### 4. Run autonomous loop

From repo root `hackathon/natt-pundit/`:

```bash
# Check pool + agent position
node scripts/natt-agent-cdp-autonomous.mjs status --fixture <FIXTURE_ID>

# Full loop: deposit (pre-kickoff) → poll → refund | settle | claim until done
node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <FIXTURE_ID> --outcome home

# Post-match payout only
node scripts/natt-agent-cdp-autonomous.mjs recover --fixture <FIXTURE_ID>
```

**Docker (VPS smoke):**

```bash
docker run --rm -v ~/HYPERNATT/hackathon/natt-pundit:/app -w /app \
  --env-file ~/HYPERNATT/.env \
  -e NATT_PUNDIT_CDP_SOLANA_ADDRESS=<agent-pubkey> \
  node:22-alpine node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <ID>
```

---

## Option B — Local keypair (dev / CI)

Script: `scripts/natt-agent-autonomous.mjs`

```bash
export AGENT_WALLET_SECRET='[1,2,3,...]'   # or AGENT_WALLET_KEYPAIR_PATH
node scripts/natt-agent-autonomous.mjs auto --fixture <ID> --outcome home
```

Same MCP URL and commands (`auto`, `recover`, `status`).

---

## MCP connect (read-only — no wallet needed)

For jury quick smoke without CDP:

1. Add MCP URL in Cursor / Claude: `https://hypernatt.com/mcp-pundit/protocol`
2. First tool: `get_pundit_manifest`
3. Browse: `get_match_edge`, `get_escrow_pool_status`, etc.

See [`CURSOR_NATT_PUNDIT_MCP.md`](./CURSOR_NATT_PUNDIT_MCP.md).

**Note:** Opening `/protocol` in a browser tab returns `Initialize MCP with POST` — that is **expected** (MCP is not a web page). Use `/pundit/info` or `/health` in the browser instead.

---

## x402 vs escrow deposit

| Flow | Payment |
|------|---------|
| MCP paid read tools | x402 $0.01 devnet USDC (optional; hackathon may have open access) |
| Escrow `deposit` | SPL USDC into pool vault — **separate** from x402 |

---

## Related docs

- [`USER_GUIDE.md`](./USER_GUIDE.md) — fan betting + MCP connect
- [`QUICKSTART_JURY.md`](./QUICKSTART_JURY.md) — 5-minute jury path
- [`SUBMISSION_KIT.md`](./SUBMISSION_KIT.md) — smoke curls + video outline
- In-app manual (8 languages): https://hypernatt.com/fr/nattpundit?tab=docs → **Autonomous agent (CDP wallet)**
