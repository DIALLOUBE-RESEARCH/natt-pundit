/**
 * F72N — Natt Pundit MCP (Streamable HTTP + x402 devnet).
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  buildPaymentRequired,
  buildPaymentRequirements,
  getPayto,
  isPaytoConfigured,
  PUNDIT_PRICE_USDC,
  PUBLIC_MCP_URL,
  SOLANA_DEVNET_NETWORK,
} from "./x402-pundit.mjs";
import {
  settlePaymentWithFacilitator,
  verifyPaymentWithFacilitator,
} from "./x402-facilitator-client.mjs";
import { processPunditX402Payment } from "./x402-funnel.mjs";
import {
  assertSessionClient,
  clientKeyFromHttpRequest,
  isSessionBindEnabled,
  registerSessionClient,
  removeSessionClient,
} from "./mcp-session-bind.mjs";
import {
  consumeIntroFree,
  isDevnetOpenAccess,
  isJuryBypassWallet,
} from "./intro-free.mjs";
import {
  fetchClvVerdict,
  fetchDataIndex,
  fetchEdgeSummary,
  fetchFixtures,
  fetchMatchEdge,
  fetchOdds,
  fetchProof,
  fetchScores,
  verifyProof,
} from "./pundit-client.mjs";
import {
  fetchEscrowPool,
  fetchCpiSettleArgs,
  buildCreatePoolTx,
  buildDepositTx,
  buildSettleTx,
  buildClaimTx,
  buildRefundTx,
  buildRefundAllTx,
  submitSignedEscrowTx,
} from "./escrow-agent.mjs";
import { fetchFixtureAgentStatus } from "./agent-status.mjs";
import { AGENT_STOP_BET_CONDITIONS } from "./agent-edge-policy.mjs";
import {
  AGENT_SERVER_INSTRUCTIONS,
  CLAUDE_WEB_CONNECTOR_HINTS,
} from "./mcp-agent-instructions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUNDIT_VERSION = "0.3.4";
const SERVER_TITLE = "Natt Pundit — TxLINE World Cup MCP for AI Agents";

/** Single source of truth — keep in sync with registerTool() below. */
export const PUNDIT_TOOL_NAMES = [
  "get_pundit_manifest",
  "get_wc_fixtures",
  "get_settlement_proof",
  "verify_settlement_proof",
  "get_match_edge",
  "get_edge_summary",
  "get_clv_verdict",
  "get_data_lab_index",
  "get_match_odds",
  "get_live_scores",
  "get_escrow_pool",
  "build_escrow_create_pool_tx",
  "build_escrow_deposit_tx",
  "get_cpi_settle_args",
  "build_escrow_settle_tx",
  "build_escrow_claim_tx",
  "build_escrow_refund_tx",
  "build_escrow_refund_all_tx",
  "get_fixture_agent_status",
  "submit_signed_escrow_tx",
];

const sessionPayments = new Map();
const sessionClientMeta = new Map();
/** @type {Map<string, { transport: import('@modelcontextprotocol/sdk/server/streamableHttp.js').StreamableHTTPServerTransport, mcpServer: import('@modelcontextprotocol/sdk/server/mcp.js').McpServer }>} */
const sessions = new Map();

function loadServerCard() {
  try {
    return JSON.parse(readFileSync(join(__dirname, "server-card.json"), "utf-8"));
  } catch {
    return null;
  }
}

function jsonResult(value, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

function capturePaymentHeader(req, sessionId) {
  const raw = req.headers["x-payment"] || req.headers["X-Payment"];
  if (raw && sessionId) {
    sessionPayments.set(sessionId, Array.isArray(raw) ? raw[0] : raw);
  }
}

async function tryX402Payment({ tool, x_payment, sessionId }) {
  if (!isPaytoConfigured()) return null;

  let paymentRaw = x_payment;
  if (!paymentRaw && sessionId) {
    paymentRaw = sessionPayments.get(sessionId);
  }
  if (!paymentRaw) return null;

  const result = await processPunditX402Payment({
    tool,
    paymentRaw,
    verifyPaymentFn: verifyPaymentWithFacilitator,
    settlePaymentFn: settlePaymentWithFacilitator,
  });

  if (result.error) {
    return {
      errorResult: jsonResult(buildPaymentRequired(tool, result.message || result.error), true),
    };
  }

  if (result.txHash) {
    console.log(`[F77N] settled ${tool}: ${result.txHash}`);
  }

  return {
    ok: true,
    bypass: result.bypass,
    x402_verified: true,
    x402_settled: result.x402_settled,
    txHash: result.txHash,
  };
}

async function ensurePaidAccess({ tool, x_payment, agent_wallet, sessionId }) {
  const wallet = typeof agent_wallet === "string" ? agent_wallet.trim() : "";
  if (isJuryBypassWallet(wallet)) {
    return { ok: true, bypass: "jury" };
  }

  const x402 = await tryX402Payment({ tool, x_payment, sessionId });
  if (x402) return x402;

  if (isDevnetOpenAccess()) {
    return { ok: true, bypass: "devnet_open", devnet_open: true };
  }

  if (consumeIntroFree(tool, wallet)) {
    return { ok: true, bypass: "intro_free", intro_free_consumed: true };
  }

  if (!isPaytoConfigured()) {
    return {
      errorResult: jsonResult(
        {
          error: "x402_not_configured",
          message: "Set PUNDIT_X402_PAYTO on VPS for paid access after intro-free.",
        },
        true,
      ),
    };
  }

  return { errorResult: jsonResult(buildPaymentRequired(tool), true) };
}

function buildManifest(locale = "en") {
  return {
    name: "natt-pundit",
    title: SERVER_TITLE,
    version: PUNDIT_VERSION,
    locale,
    server_instructions: AGENT_SERVER_INSTRUCTIONS,
    claude_web: CLAUDE_WEB_CONNECTOR_HINTS,
    transport: "streamable-http",
    url: PUBLIC_MCP_URL,
    public_repo: "https://github.com/DIALLOUBE-RESEARCH/natt-pundit",
    pricing_usdc: String(PUNDIT_PRICE_USDC),
    network: "solana-devnet",
    network_caip2: SOLANA_DEVNET_NETWORK,
    pay_to: getPayto(),
    faucets: {
      usdc: "https://faucet.circle.com/ (Solana Devnet)",
      sol: "https://faucet.solana.com/",
    },
    cursor_mcp_snippet: {
      mcpServers: {
        "natt-pundit": { url: PUBLIC_MCP_URL },
      },
    },
    free_tools: [
      "get_pundit_manifest",
      "get_wc_fixtures",
      "get_settlement_proof",
      "verify_settlement_proof",
      "get_clv_verdict",
      "get_data_lab_index",
    ],
    paid_tools: [
      "get_match_edge",
      "get_edge_summary",
      "get_match_odds",
      "get_live_scores",
      "get_cpi_settle_args",
      "build_escrow_deposit_tx",
      "build_escrow_settle_tx",
    ],
    escrow_tools: [
      "get_escrow_pool",
      "get_fixture_agent_status",
      "build_escrow_create_pool_tx",
      "build_escrow_deposit_tx",
      "get_cpi_settle_args",
      "build_escrow_settle_tx",
      "build_escrow_claim_tx",
      "build_escrow_refund_tx",
      "build_escrow_refund_all_tx",
      "submit_signed_escrow_tx",
    ],
    agent_escrow_flow: [
      "0. get_fixture_agent_status(fixture_id) — no wallet OK → analyze_only + edge + CLV",
      "1. get_clv_verdict — Data Lab gate (NOT PROVEN until N>=500)",
      "2. Optional: pass agent_wallet only if user/agent will sign devnet escrow txs",
      "3. If deposit_policy.deposit_allowed AND has_wallet: build_escrow_deposit_tx",
      "4. sign locally → submit_signed_escrow_tx",
    ],
    agent_betting_policy: {
      wallet_optional_for: ["get_fixture_agent_status analysis", "get_match_edge", "get_clv_verdict"],
      wallet_required_for: ["build_escrow_*", "submit_signed_escrow_tx"],
      never_invent_wallet: true,
      never_deposit_on: ["HOLD", "low_conviction", "no_odds", "edge_unavailable", "no_wallet"],
      setup_requires: "verdict=SETUP AND conviction>=medium AND direction set",
      clv_not_proven: "stake_multiplier=0.5 max when wallet present",
      analyze_only_without_wallet: "next_action=analyze_only, can_bet=false",
      stop_bet_conditions: AGENT_STOP_BET_CONDITIONS,
    },
    agent_autonomy_script: "hackathon/natt-pundit/scripts/natt-agent-autonomous.mjs",
    agent_security: "MCP never stores private keys; x402 pays API only, escrow deposit is a separate Solana tx.",
    devnet_open_access: isDevnetOpenAccess(),
    pricing_note: isDevnetOpenAccess()
      ? "Hackathon: paid tools free without wallet; send x_payment to prove CDP x402 devnet."
      : "Intro-free 1 call/tool/day then x402 $0.01 USDC devnet.",
    hackathon: "TxODDS World Cup — Prediction Markets & Settlement",
    homepage: "https://hypernatt.com/fr/nattpundit",
    tools_registered: PUNDIT_TOOL_NAMES.length,
    tools_list_capability: { listChanged: true },
    tool_discovery_note:
      "Fresh MCP session returns all tools via tools/list. If your client still shows an old subset (e.g. 5 tools), start a new chat (Claude) or Reload MCP (Cursor). Manifest may update before stale client tool lists.",
    first_tool: "get_pundit_manifest",
  };
}

function isInitializedNotification(body) {
  return Boolean(body && body.method === "notifications/initialized");
}

function pokeToolListChanged(mcpServer) {
  try {
    mcpServer.sendToolListChanged();
  } catch (err) {
    console.warn("[natt-pundit-mcp] sendToolListChanged failed:", err);
  }
}

export function createMcpServer() {
  const server = new McpServer({
    name: "natt-pundit",
    version: PUNDIT_VERSION,
  });

  const paymentFields = {
    x_payment: z
      .string()
      .optional()
      .describe("x402 payment payload (base64 JSON). Omit for 402 instructions."),
    agent_wallet: z
      .string()
      .optional()
      .describe("Solana wallet pubkey (base58) for intro-free / jury bypass."),
  };

  server.registerTool(
    "get_pundit_manifest",
    {
      description:
        "CALL FIRST. Discovery manifest: all 20 tools, agent escrow loop, Data Lab CLV gate, Claude web setup hints. No auth/OAuth required.",
      inputSchema: { locale: z.string().optional() },
    },
    async ({ locale }) => jsonResult(buildManifest(locale || "en")),
  );

  server.registerTool(
    "get_wc_fixtures",
    {
      description:
        "List FIFA World Cup fixtures from TxLINE. Use before any fixture_id tool. Returns fixture_id, teams, kickoff, status.",
      inputSchema: {
        status: z.enum(["scheduled", "live", "finished"]).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ status, limit }) => {
      try {
        const data = await fetchFixtures({ status, limit });
        return jsonResult({ ok: true, data });
      } catch (err) {
        return jsonResult(
          { error: "fixtures_fetch_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_settlement_proof",
    {
      description: "TxLINE Merkle settlement proof for a fixture.",
      inputSchema: { fixture_id: z.string().describe("TxLINE fixture id") },
    },
    async ({ fixture_id }) => {
      try {
        const data = await fetchProof(fixture_id);
        return jsonResult({ ok: true, fixture_id, data });
      } catch (err) {
        return jsonResult(
          { error: "proof_fetch_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "verify_settlement_proof",
    {
      description: "Off-chain verify Merkle settlement proof.",
      inputSchema: { fixture_id: z.string() },
    },
    async ({ fixture_id }) => {
      try {
        const data = await verifyProof(fixture_id);
        return jsonResult({ ok: true, fixture_id, data });
      } catch (err) {
        return jsonResult(
          { error: "proof_verify_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_match_edge",
    {
      description: "Natt SETUP/HOLD edge for one fixture ($0.01 USDC devnet).",
      inputSchema: { fixture_id: z.string(), ...paymentFields },
    },
    async ({ fixture_id, x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "get_match_edge",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const data = await fetchMatchEdge(fixture_id);
        return jsonResult({
          ok: true,
          fixture_id,
          bypass: access.bypass,
          intro_free_consumed: access.intro_free_consumed ?? false,
          data,
        });
      } catch (err) {
        return jsonResult(
          { error: "edge_fetch_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_edge_summary",
    {
      description: "SETUP/HOLD board for WC fixtures ($0.01 USDC devnet).",
      inputSchema: paymentFields,
    },
    async ({ x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "get_edge_summary",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const data = await fetchEdgeSummary();
        return jsonResult({
          ok: true,
          bypass: access.bypass,
          intro_free_consumed: access.intro_free_consumed ?? false,
          data,
        });
      } catch (err) {
        return jsonResult(
          { error: "edge_summary_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_clv_verdict",
    {
      description:
        "Data Lab CLV verdict (N, mean CLV, bootstrap CI, certified or not). Free — call before autonomous bets.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await fetchClvVerdict();
        return jsonResult({
          ok: true,
          data,
          agent_note:
            data.verdict === "verified"
              ? "CLV certified — full stake on SETUP allowed."
              : "CLV NOT PROVEN YET — use half stake or observe until N>=500 with positive CI.",
        });
      } catch (err) {
        return jsonResult(
          { error: "clv_fetch_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_data_lab_index",
    {
      description:
        "Data Lab stream index (odds, scores, edge, proof, ticks, latency record counts). Free.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await fetchDataIndex();
        return jsonResult({ ok: true, data });
      } catch (err) {
        return jsonResult(
          { error: "data_index_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_match_odds",
    {
      description: "TxLINE 1X2 odds for a fixture ($0.01 USDC devnet).",
      inputSchema: { fixture_id: z.string(), ...paymentFields },
    },
    async ({ fixture_id, x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "get_match_odds",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const data = await fetchOdds(fixture_id);
        return jsonResult({
          ok: true,
          fixture_id,
          bypass: access.bypass,
          data,
        });
      } catch (err) {
        return jsonResult(
          { error: "odds_fetch_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_live_scores",
    {
      description: "Live scores + clock from TxLINE ($0.01 USDC devnet).",
      inputSchema: { fixture_id: z.string(), ...paymentFields },
    },
    async ({ fixture_id, x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "get_live_scores",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const data = await fetchScores(fixture_id);
        return jsonResult({
          ok: true,
          fixture_id,
          bypass: access.bypass,
          data,
        });
      } catch (err) {
        return jsonResult(
          { error: "scores_fetch_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  const agentWalletField = {
    agent_wallet: z
      .string()
      .describe("Agent Solana wallet pubkey (base58) — fee payer and signer for unsigned tx."),
  };

  const optionalAgentWalletField = {
    agent_wallet: z
      .string()
      .optional()
      .describe(
        "Optional Solana devnet pubkey. Omit for analysis-only (edge + CLV, no escrow). Required for build_escrow_* / submit.",
      ),
  };

  server.registerTool(
    "get_escrow_pool",
    {
      description: "Read parimutuel escrow pool state on Solana devnet (free).",
      inputSchema: { fixture_id: z.string() },
    },
    async ({ fixture_id }) => {
      try {
        return jsonResult(await fetchEscrowPool(fixture_id));
      } catch (err) {
        return jsonResult(
          { error: "escrow_pool_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "build_escrow_create_pool_tx",
    {
      description: "Unsigned tx: create escrow pool before kickoff (free, devnet).",
      inputSchema: {
        fixture_id: z.string(),
        kickoff_at: z.string().describe("ISO kickoff datetime from get_wc_fixtures."),
        ...agentWalletField,
      },
    },
    async ({ fixture_id, kickoff_at, agent_wallet }) => {
      try {
        return jsonResult(await buildCreatePoolTx({ fixture_id, kickoff_at, agent_wallet }));
      } catch (err) {
        return jsonResult(
          { error: "build_create_pool_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "build_escrow_deposit_tx",
    {
      description:
        "Unsigned tx: deposit USDC devnet into escrow (min 0.01). Agent signs locally.",
      inputSchema: {
        fixture_id: z.string(),
        outcome: z.enum(["home", "draw", "away"]),
        amount_usdc: z.number().min(0.01).default(0.01),
        ...paymentFields,
        ...agentWalletField,
      },
    },
    async ({ fixture_id, outcome, amount_usdc, x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "build_escrow_deposit_tx",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const body = await buildDepositTx({
          fixture_id,
          outcome,
          amount_usdc: amount_usdc ?? 0.01,
          agent_wallet,
        });
        return jsonResult({ ...body, bypass: access.bypass });
      } catch (err) {
        return jsonResult(
          { error: "build_deposit_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_cpi_settle_args",
    {
      description: "TxLINE CPI validate_stat args for settle ($0.01 devnet or devnet_open).",
      inputSchema: {
        fixture_id: z.string(),
        outcome: z.enum(["home", "draw", "away"]),
        ...paymentFields,
      },
    },
    async ({ fixture_id, outcome, x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "get_cpi_settle_args",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const data = await fetchCpiSettleArgs(fixture_id, outcome);
        return jsonResult({ ok: true, fixture_id, outcome, bypass: access.bypass, cpi_args: data });
      } catch (err) {
        return jsonResult(
          { error: "cpi_args_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "build_escrow_settle_tx",
    {
      description: "Unsigned tx: settle pool via TxLINE CPI after match ended.",
      inputSchema: {
        fixture_id: z.string(),
        outcome: z.enum(["home", "draw", "away"]),
        cpi_args: z
          .record(z.any())
          .describe(
            "Full object from get_cpi_settle_args (cpi_args field). Do not pass a partial subset — must include stat1, fixtureProof, mainTreeProof, etc.",
          ),
        ...paymentFields,
        ...agentWalletField,
      },
    },
    async ({ fixture_id, outcome, cpi_args, x_payment, agent_wallet }, extra) => {
      const access = await ensurePaidAccess({
        tool: "build_escrow_settle_tx",
        x_payment,
        agent_wallet,
        sessionId: extra?.sessionId,
      });
      if (access.errorResult) return access.errorResult;
      try {
        const body = await buildSettleTx({ fixture_id, outcome, agent_wallet, cpi_args });
        return jsonResult({ ...body, bypass: access.bypass });
      } catch (err) {
        return jsonResult(
          { error: "build_settle_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "build_escrow_claim_tx",
    {
      description: "Unsigned tx: claim winnings after pool settled (free, devnet).",
      inputSchema: {
        fixture_id: z.string(),
        ...agentWalletField,
      },
    },
    async ({ fixture_id, agent_wallet }) => {
      try {
        return jsonResult(await buildClaimTx({ fixture_id, agent_wallet }));
      } catch (err) {
        return jsonResult(
          { error: "build_claim_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "build_escrow_refund_tx",
    {
      description:
        "Unsigned tx: full stake refund when pool is UNMATCHED (<=1 funded side). No settle/CPI.",
      inputSchema: {
        fixture_id: z.string(),
        ...agentWalletField,
      },
    },
    async ({ fixture_id, agent_wallet }) => {
      try {
        return jsonResult(await buildRefundTx({ fixture_id, agent_wallet }));
      } catch (err) {
        return jsonResult(
          { error: "build_refund_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "build_escrow_refund_all_tx",
    {
      description:
        "Unsigned tx: full refund when parimutuel pool settled on an unfunded winning issue.",
      inputSchema: {
        fixture_id: z.string(),
        ...agentWalletField,
      },
    },
    async ({ fixture_id, agent_wallet }) => {
      try {
        return jsonResult(await buildRefundAllTx({ fixture_id, agent_wallet }));
      } catch (err) {
        return jsonResult(
          { error: "build_refund_all_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "get_fixture_agent_status",
    {
      description:
        "Fixture analysis + edge + CLV deposit gate + escrow next_action. agent_wallet optional (omit = analyze_only, no bet).",
      inputSchema: {
        fixture_id: z.string(),
        ...optionalAgentWalletField,
      },
    },
    async ({ fixture_id, agent_wallet }) => {
      try {
        return jsonResult(await fetchFixtureAgentStatus(fixture_id, agent_wallet));
      } catch (err) {
        return jsonResult(
          { error: "agent_status_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  server.registerTool(
    "submit_signed_escrow_tx",
    {
      description:
        "Broadcast a signed Solana devnet escrow tx (base64). Server never holds private keys. Free.",
      inputSchema: {
        signed_transaction_base64: z
          .string()
          .describe("Fully signed transaction from build_escrow_* tools."),
        ...agentWalletField,
      },
    },
    async ({ signed_transaction_base64, agent_wallet }) => {
      try {
        return jsonResult(
          await submitSignedEscrowTx({ signed_transaction_base64, agent_wallet }),
        );
      } catch (err) {
        return jsonResult(
          { error: "submit_signed_failed", message: String(err.message || err) },
          true,
        );
      }
    },
  );

  return server;
}

function ensureStreamableHttpAccept(req) {
  const accept = String(req.headers.accept || "");
  if (!accept.includes("application/json") && !accept.includes("text/event-stream")) {
    req.headers.accept = "application/json, text/event-stream";
  }
}

/**
 * @param {import('express').Express} app
 */
export function mountMcpPunditRoutes(app) {
  const card = loadServerCard();

  app.get("/.well-known/mcp/server-card.json", (_req, res) => {
    if (card) {
      res.json(card);
      return;
    }
    res.status(404).json({ error: "server-card missing" });
  });

  app.get("/pundit/info", (_req, res) => {
    res.json({
      name: "natt-pundit",
      title: SERVER_TITLE,
      version: PUNDIT_VERSION,
      server_instructions: AGENT_SERVER_INSTRUCTIONS,
      claude_web: CLAUDE_WEB_CONNECTOR_HINTS,
      tools: PUNDIT_TOOL_NAMES,
      tools_count: PUNDIT_TOOL_NAMES.length,
      tools_list_capability: { listChanged: true },
      transports: { streamable_http: "/mcp-pundit/protocol" },
      x402: {
        price_usdc: PUNDIT_PRICE_USDC,
        pay_to: getPayto(),
        network: SOLANA_DEVNET_NETWORK,
        devnet_open_access: isDevnetOpenAccess(),
      },
      session_bind_enabled: isSessionBindEnabled(),
      homepage: "https://hypernatt.com/fr/nattpundit",
      public_repo: "https://github.com/DIALLOUBE-RESEARCH/natt-pundit",
      mcp_url: PUBLIC_MCP_URL,
    });
  });

  app.all("/protocol", async (req, res) => {
    try {
      ensureStreamableHttpAccept(req);
      const sessionId = req.headers["mcp-session-id"];
      capturePaymentHeader(req, sessionId);

      if (sessionId && sessions.has(sessionId)) {
        if (isSessionBindEnabled()) {
          const clientKey = clientKeyFromHttpRequest(req);
          if (!assertSessionClient(sessionClientMeta, sessionId, clientKey)) {
            res.status(403).json({
              error: "session_client_mismatch",
              message: "mcp-session-id is bound to another client fingerprint",
            });
            return;
          }
        }
        const { transport, mcpServer } = sessions.get(sessionId);
        await transport.handleRequest(req, res, req.body);
        if (isInitializedNotification(req.body)) {
          pokeToolListChanged(mcpServer);
        }
        return;
      }

      if (req.method === "POST" && isInitializeRequest(req.body)) {
        const mcpServer = createMcpServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, { transport, mcpServer });
            capturePaymentHeader(req, id);
            if (isSessionBindEnabled()) {
              registerSessionClient(sessionClientMeta, id, clientKeyFromHttpRequest(req));
            }
          },
        });
        transport.onclose = () => {
          if (transport.sessionId) {
            sessions.delete(transport.sessionId);
            sessionPayments.delete(transport.sessionId);
            removeSessionClient(sessionClientMeta, transport.sessionId);
          }
        };
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        error: "Initialize MCP with POST /mcp-pundit/protocol",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[natt-pundit-mcp] protocol error:", message);
      if (!res.headersSent) {
        res.status(500).json({ error: "mcp_internal_error", message });
      }
    }
  });

  console.log(`[natt-pundit-mcp] v${PUNDIT_VERSION} — ${PUNDIT_TOOL_NAMES.length} tools, x402 devnet $${PUNDIT_PRICE_USDC}`);
}
