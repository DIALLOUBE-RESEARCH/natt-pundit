# Natt Pundit — User Guide (8 languages in-app)

**In-app manual (recommended):** https://hypernatt.com/fr/nattpundit?lang=en&tab=docs

Switch language in the header — **en, fr, es, zh, ja, ru, pt, de** — the Docs tab follows.

---

## Quick links

| Topic | URL |
|-------|-----|
| App | https://hypernatt.com/fr/nattpundit?lang=en |
| **8 languages** | `?lang=en` / `fr` / `es` / `zh` / `ja` / `ru` / `pt` / `de` — header pill or URL |
| **In-app docs (8 langs)** | https://hypernatt.com/fr/nattpundit?lang=en&tab=docs |
| Wallet tab | https://hypernatt.com/fr/nattpundit?lang=en&tab=wallet |
| MCP endpoint | https://hypernatt.com/mcp-pundit/protocol |
| SOL devnet faucet | https://faucet.solana.com/ |
| USDC devnet faucet | https://faucet.circle.com/ (select Solana Devnet) |

---

## 0. UI: 8 languages & light/dark mode

| Feature | How |
|---------|-----|
| **Languages** | Header language pill — **en, fr, es, zh, ja, ru, pt, de**. Docs tab follows. Deep link: `?lang=fr` |
| **Light / dark** | Sun/moon toggle **top-left** — Stitch glass theme on all tabs; Reown wallet modal matches |
| **Jury demo** | Try `?lang=es&tab=docs` → toggle dark → connect Wallet |

Full detail in-app: Docs → **8 languages & light/dark mode** (translated in all 8 locales).

---

## 1. Fund devnet wallet

1. Connect wallet — **Reown AppKit** (Phantom / Solflare / **WalletConnect** on mobile). Solana stack, not EVM wagmi.
2. Switch wallet to **Solana Devnet**.
3. Get **SOL** from https://faucet.solana.com/ (~0.01+ SOL per tx batch).
4. Get **USDC** from https://faucet.circle.com/ (min stake **0.01 USDC**).
5. Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

---

## 2. How to bet (escrow)

**Pre-match only.** Shared pool — winners split the pot (not fixed bookmaker odds).

1. **Wallet** — connect Solana on the match page.
2. **Place bet** — tap the **country flag** (or Draw in group stage), enter stake ≥ 0.01 USDC, tap **Place bet**.
3. **After match** — tap **Collect payout** on the match page (or Wallet tab for archived fixtures).

**UNMATCHED** (one side only): **Refund stake** after kickoff.

Technical Merkle proof details: **Transparency** section on finished matches.

---

## 3. Recover winnings (archived matches)

Finished matches may leave the fixtures board. Use **Wallet → Bet activity**:

- **Collect payout** — claimable or open after kickoff (settlement + claim in one step).
- **Refund stake** — refund eligible.

---

## 4. Connect an AI agent (MCP)

**20 tools** — fixtures, edge, odds, scores, escrow tx builders, settle/claim.

**MCP is HTTP only** — add the URL below in Cursor, Claude, or any MCP client. There is no Smithery listing for this server.

### Cursor

Header → **Connect Agent** → Cursor → Open in Cursor.

Or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "natt-pundit": {
      "url": "https://hypernatt.com/mcp-pundit/protocol"
    }
  }
}
```

First prompt: `get_pundit_manifest`

### Claude.ai (web)

Connectors → Add custom → Name **Natt Pundit**, URL = MCP endpoint, OAuth empty.

### Claude Code

```bash
claude mcp add --scope user --transport http natt-pundit https://hypernatt.com/mcp-pundit/protocol
```

See also: [CURSOR_NATT_PUNDIT_MCP.md](./CURSOR_NATT_PUNDIT_MCP.md)

---

## 5. Autonomous agent (CDP wallet — same stack as us)

**Read-only demo:** https://hypernatt.com/fr/nattpundit/agent?lang=en

| Step | Action |
|------|--------|
| 1 | [Coinbase CDP](https://portal.cdp.coinbase.com/) project + API keys + Wallet Secret |
| 2 | Env: `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET` |
| 3 | Fund agent Solana devnet address (SOL + USDC faucets) |
| 4 | `node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <ID> --outcome home` |

Full guide: [`AUTONOMOUS_AGENT_CDP.md`](./AUTONOMOUS_AGENT_CDP.md) · In-app Docs → **Autonomous agent (CDP wallet)** (8 languages).

**Dev alternative:** `scripts/natt-agent-autonomous.mjs` + `AGENT_WALLET_SECRET` (local keypair).

---

*Full sections: wallet, Data Lab, API, limitations — in-app Docs tab (switch language in header: en, fr, es, zh, ja, ru, pt, de).*
