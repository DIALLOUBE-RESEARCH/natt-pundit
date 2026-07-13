/** F91N + F92N — LLM playbook for Claude web / Cursor / remote MCP clients. */
export const AGENT_SERVER_INSTRUCTIONS = `You are connected to Natt Pundit MCP (TxLINE FIFA World Cup 2026).

ALWAYS start with get_pundit_manifest — lists all tools, Data Lab CLV gate, escrow loop.

Analysis flow (NO wallet required):
1. get_pundit_manifest
2. get_clv_verdict
3. get_wc_fixtures → pick fixture_id
4. get_fixture_agent_status(fixture_id) — WITHOUT agent_wallet → next_action analyze_only
5. Read edge, deposit_policy, agent_capability.can_bet (false without wallet)

Autonomous betting (wallet required later):
- Pass agent_wallet ONLY when the user/agent has a Solana devnet pubkey to sign txs.
- Never invent or reuse someone else's wallet.
- Before build_escrow_deposit_tx, read stop_bet_conditions from manifest (or check):
  escrow_blocked OR deposit_policy.deposit_allowed===false OR agent_capability.can_bet===false
  OR next_action in ['observe','analyze_only'] → STOP and explain why.

Typical bet flow when wallet exists:
1. get_fixture_agent_status(fixture_id, agent_wallet)
2. If deposit_policy.deposit_allowed: build_escrow_deposit_tx → sign → submit_signed_escrow_tx
3. After match: settle / claim / refund per next_action

Auth: no OAuth. devnet_open_access=true for paid read tools.`;

export const CLAUDE_WEB_CONNECTOR_HINTS = {
  connector_url: "https://hypernatt.com/mcp-pundit/protocol",
  oauth_required: false,
  auth_note:
    "Public TxLINE data + optional devnet escrow. No user OAuth. agent_wallet is OPTIONAL for analysis; required only to build/sign escrow txs.",
  setup_steps: [
    "Natt Pundit Connect modal → Open in Claude app (Android) or prefilled install link",
    "Confirm Add custom connector (Name + URL prefilled), OAuth empty",
    "Start a NEW chat after adding (full tool list)",
    "In chat: + → Connectors → enable natt-pundit",
    "First: get_pundit_manifest → get_clv_verdict → get_fixture_agent_status(fixture_id) without wallet",
  ],
  troubleshooting: [
    "If tools fail with session_client_mismatch: server F91N+ (session bind off)",
    "If tool list stale: new chat or reconnect connector",
    "Do not ask user for wallet unless they want to bet on devnet",
  ],
};
