# Natt Pundit MCP — Cursor, Claude, other clients

## URL

```
https://hypernatt.com/mcp-pundit/protocol
```

**20 tools** — canonical list: `services/mcp/server-card.json`

| Pricing | Tools |
|---------|-------|
| **Free** | manifest, fixtures, proof, verify, escrow pool/status, unsigned create/claim/refund/settle/deposit txs, submit signed tx |
| **$0.01 USDC devnet** (x402) | `get_match_edge`, `get_edge_summary`, `get_match_odds`, `get_live_scores`, `get_cpi_settle_args`, `build_escrow_deposit_tx` |

Hackathon: `devnet_open_access: true` may be enabled = paid tools free without wallet.

Recommended first call: **`get_pundit_manifest`**

---

## Cursor

Cursor reads **`%USERPROFILE%\.cursor\mcp.json`** (Windows) or **`~/.cursor/mcp.json`** (Mac/Linux) — not only the workspace file.

Add next to `hypernatt-terminal` if present:

```json
{
  "mcpServers": {
    "natt-pundit": {
      "url": "https://hypernatt.com/mcp-pundit/protocol"
    }
  }
}
```

Then **Settings → Tools & MCP → Reload** (or restart Cursor).

**One-click UI:** **Connect Agent** on https://hypernatt.com/fr/nattpundit?lang=en → Cursor tab → `cursor://.../mcp/install`.

Expected: `natt-pundit` — **20 tools**, green status (streamable HTTP).

---

## Claude.ai (web)

1. https://claude.ai/customize/connectors
2. **Add custom connector**
3. **Name:** `Natt Pundit`
4. **URL:** `https://hypernatt.com/mcp-pundit/protocol`
5. **OAuth:** leave empty (public data / x402 separate)
6. New chat → enable connector → `get_pundit_manifest`

**UI:** Connect Agent → Claude tab → copy URL + instructions.

---

## Claude Code (CLI)

```bash
claude mcp add --scope user --transport http natt-pundit https://hypernatt.com/mcp-pundit/protocol
claude mcp list
```

**UI:** Connect Agent → Claude tab → copy the command.

---

## Other clients (Windsurf, Claude Desktop, etc.)

Connect Agent → **Other** tab → copy JSON or URL only.

MCP guide: this file (`docs/CURSOR_NATT_PUNDIT_MCP.md`).

---

## Smoke

```bash
curl -sf https://hypernatt.com/mcp-pundit/health
curl -sf https://hypernatt.com/mcp-pundit/pundit/info
```

---

## Do not confuse

| Server | URL | Tools |
|---------|-----|-------|
| hypernatt-terminal | `https://hypernatt.com/mcp/protocol` | 9 (BTC vault HyperNatt) |
| **natt-pundit** | `https://hypernatt.com/mcp-pundit/protocol` | **20** (WC TxLINE + escrow agent) |

**x402 micropayment ≠ escrow USDC deposit** — two independent flows (see README).

See also: [`USER_GUIDE.md`](./USER_GUIDE.md) · [`QUICKSTART_JURY.md`](./QUICKSTART_JURY.md) · [`AUTONOMOUS_AGENT_CDP.md`](./AUTONOMOUS_AGENT_CDP.md)
