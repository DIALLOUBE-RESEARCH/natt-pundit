#!/usr/bin/env node
/**
 * F73N — Autonomous agent: MCP → sign → submit → poll until funds recovered.
 *
 * Usage:
 *   AGENT_WALLET_SECRET='[...]' node scripts/natt-agent-autonomous.mjs auto --fixture 18179763 --outcome home
 *   AGENT_WALLET_SECRET='[...]' node scripts/natt-agent-autonomous.mjs status --fixture 18179763
 *
 * Modes:
 *   auto          deposit (if needed) + poll until refund/settle/claim/done
 *   deposit       one-shot deposit
 *   recover       post-match payout only
 *   settle-claim  legacy alias (refund-aware)
 *   status        JSON agent status
 *
 * Env:
 *   AGENT_WALLET_SECRET / AGENT_WALLET_KEYPAIR_PATH
 *   NATT_PUNDIT_MCP_URL   default https://hypernatt.com/mcp-pundit/protocol
 *   AGENT_POLL_MS         default 30000
 */
import { readFileSync } from "node:fs";
import { Keypair, Transaction } from "@solana/web3.js";
import { shouldStopBet } from "../services/mcp/agent-edge-policy.mjs";

const MCP_URL = process.env.NATT_PUNDIT_MCP_URL || "https://hypernatt.com/mcp-pundit/protocol";
const DEFAULT_POLL_MS = Number(process.env.AGENT_POLL_MS || 30_000);
const PAYOUT_ACTIONS = new Set(["refund", "refund_all", "settle", "claim"]);
const TERMINAL_ACTIONS = new Set(["done", "none"]);

function loadKeypairSync() {
  const path = process.env.AGENT_WALLET_KEYPAIR_PATH?.trim();
  const raw =
    process.env.AGENT_WALLET_SECRET?.trim() ||
    (path ? readFileSync(path, "utf8").trim() : "");
  if (!raw) {
    throw new Error(
      "AGENT_WALLET_SECRET or AGENT_WALLET_KEYPAIR_PATH required (JSON byte array)",
    );
  }
  if (!raw.startsWith("[")) {
    throw new Error("Use JSON byte array from solana-keygen or Phantom export.");
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

let sessionId = null;
let rpcId = 1;

async function mcpPost(payload) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
  const text = await res.text();
  let parsed = {};
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      try {
        parsed = JSON.parse(line.slice(6));
      } catch {
        /* skip */
      }
    }
  }
  if (!Object.keys(parsed).length && text.trim().startsWith("{")) {
    parsed = JSON.parse(text);
  }
  return { status: res.status, parsed };
}

async function mcpInit() {
  const { status } = await mcpPost({
    jsonrpc: "2.0",
    id: rpcId++,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "natt-agent-autonomous", version: "0.4.0" },
    },
  });
  if (status !== 200 || !sessionId) throw new Error(`MCP init failed status=${status}`);
  await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized" });
}

async function callTool(name, args = {}) {
  const { status, parsed } = await mcpPost({
    jsonrpc: "2.0",
    id: rpcId++,
    method: "tools/call",
    params: { name, arguments: args },
  });
  if (status !== 200) throw new Error(`tool ${name} http ${status}`);
  const text = parsed?.result?.content?.[0]?.text;
  if (!text) throw new Error(`tool ${name} empty response`);
  const data = JSON.parse(text);
  if (data.error || parsed?.result?.isError) {
    throw new Error(`${name}: ${data.message || data.error || "tool error"}`);
  }
  return data;
}

function signTxBase64(unsignedBase64, keypair) {
  const tx = Transaction.from(Buffer.from(unsignedBase64, "base64"));
  tx.partialSign(keypair);
  return tx.serialize().toString("base64");
}

async function submitSigned(signedBase64, agentWallet) {
  return callTool("submit_signed_escrow_tx", {
    signed_transaction_base64: signedBase64,
    agent_wallet: agentWallet,
  });
}

function parseArgs(argv) {
  const out = { mode: argv[2] || "status" };
  for (let i = 3; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--fixture") out.fixture = argv[++i];
    else if (a === "--outcome") out.outcome = argv[++i];
    else if (a === "--amount") out.amount = Number(argv[++i]);
    else if (a === "--poll-ms") out.pollMs = Number(argv[++i]);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAgentStatus(wallet, fixtureId, { verbose = false } = {}) {
  const status = await callTool("get_fixture_agent_status", {
    fixture_id: fixtureId,
    agent_wallet: wallet,
  });
  if (verbose) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    const fx = status.fixture?.status ?? "?";
    console.log(
      `[agent] fixture=${fixtureId} match=${fx} next=${status.next_action} pool=${status.pool_mode}`,
    );
  }
  return status;
}

async function runPayoutAction(keypair, fixtureId, status, outcome) {
  const wallet = keypair.publicKey.toBase58();
  const na = status.next_action;
  const out = outcome || status.suggested_outcome || "home";

  if (na === "refund") {
    const built = await callTool("build_escrow_refund_tx", {
      fixture_id: fixtureId,
      agent_wallet: wallet,
    });
    const sub = await submitSigned(signTxBase64(built.transaction_base64, keypair), wallet);
    console.log("[agent] refund tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  if (na === "refund_all") {
    const built = await callTool("build_escrow_refund_all_tx", {
      fixture_id: fixtureId,
      agent_wallet: wallet,
    });
    const sub = await submitSigned(signTxBase64(built.transaction_base64, keypair), wallet);
    console.log("[agent] refund_all tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  if (na === "settle") {
    const cpi = await callTool("get_cpi_settle_args", {
      fixture_id: fixtureId,
      outcome: out,
      agent_wallet: wallet,
    });
    const built = await callTool("build_escrow_settle_tx", {
      fixture_id: fixtureId,
      outcome: out,
      agent_wallet: wallet,
      cpi_args: cpi.cpi_args,
    });
    const sub = await submitSigned(signTxBase64(built.transaction_base64, keypair), wallet);
    console.log("[agent] settle tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  if (na === "claim") {
    const built = await callTool("build_escrow_claim_tx", {
      fixture_id: fixtureId,
      agent_wallet: wallet,
    });
    const sub = await submitSigned(signTxBase64(built.transaction_base64, keypair), wallet);
    console.log("[agent] claim tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  return false;
}

async function cmdDeposit(keypair, fixtureId, outcome, amountUsdc = 1) {
  const wallet = keypair.publicKey.toBase58();
  let status = await fetchAgentStatus(wallet, fixtureId);

  if (status.next_action === "create_pool") {
    const fixtures = await callTool("get_wc_fixtures", { limit: 50 });
    const fx = fixtures.data?.fixtures?.find((f) => f.fixtureId === fixtureId);
    if (!fx?.kickoffAt) throw new Error("fixture kickoff not found for create_pool");
    const built = await callTool("build_escrow_create_pool_tx", {
      fixture_id: fixtureId,
      kickoff_at: fx.kickoffAt,
      agent_wallet: wallet,
    });
    const sub = await submitSigned(signTxBase64(built.transaction_base64, keypair), wallet);
    console.log("[agent] create_pool tx:", sub.tx_signature);
    await sleep(2000);
    status = await fetchAgentStatus(wallet, fixtureId);
  }

  const stop = shouldStopBet(status);
  if (stop.stop || status.next_action !== "deposit") {
    if (Number(status.position?.amount || 0) > 0) {
      console.log("[agent] skip deposit — already positioned, next:", status.next_action, stop.reason || "");
      return status;
    }
    console.log("[agent] skip deposit —", stop.reason || status.next_action);
    return status;
  }

  const built = await callTool("build_escrow_deposit_tx", {
    fixture_id: fixtureId,
    outcome,
    amount_usdc: amountUsdc,
    agent_wallet: wallet,
  });
  const sub = await submitSigned(signTxBase64(built.transaction_base64, keypair), wallet);
  console.log("[agent] deposit tx:", sub.tx_signature, sub.explorer_url || "");
  await sleep(2000);
  return fetchAgentStatus(wallet, fixtureId);
}

async function cmdRecover(keypair, fixtureId, outcome) {
  const wallet = keypair.publicKey.toBase58();
  for (let step = 0; step < 8; step += 1) {
    const status = await fetchAgentStatus(wallet, fixtureId);
    const na = status.next_action;
    if (TERMINAL_ACTIONS.has(na)) {
      console.log("[agent] done —", status.detail || status.reason || na);
      return status;
    }
    if (!PAYOUT_ACTIONS.has(na)) {
      console.log("[agent] stopped —", status.detail || na);
      return status;
    }
    await runPayoutAction(keypair, fixtureId, status, outcome);
    await sleep(3000);
    const after = await fetchAgentStatus(wallet, fixtureId);
    if (TERMINAL_ACTIONS.has(after.next_action) || after.position?.claimed) {
      console.log("[agent] done —", after.detail || after.reason || after.next_action);
      return after;
    }
  }
  throw new Error("recover: max steps exceeded");
}

/** 100% autonomous: deposit → poll → refund | settle → claim until done. */
async function cmdAuto(keypair, fixtureId, outcome, amountUsdc, pollMs) {
  const wallet = keypair.publicKey.toBase58();
  console.log("[agent] AUTO start", { fixtureId, outcome, amountUsdc, pollMs });

  let status = await fetchAgentStatus(wallet, fixtureId);
  if (status.next_action === "create_pool" || status.next_action === "deposit") {
    status = await cmdDeposit(keypair, fixtureId, outcome, amountUsdc);
  }

  const deadline = Date.now() + 6 * 60 * 60 * 1000;
  while (Date.now() < deadline) {
    status = await fetchAgentStatus(wallet, fixtureId);
    const na = status.next_action;

    if (TERMINAL_ACTIONS.has(na)) {
      console.log("[agent] AUTO complete —", status.detail || status.reason || na);
      return status;
    }

    if (PAYOUT_ACTIONS.has(na)) {
      await runPayoutAction(keypair, fixtureId, status, outcome);
      await sleep(4000);
      continue;
    }

    if (na === "wait_match") {
      await sleep(pollMs);
      continue;
    }

    if (na === "create_pool" || na === "deposit") {
      status = await cmdDeposit(keypair, fixtureId, outcome, amountUsdc);
      await sleep(2000);
      continue;
    }

    console.log("[agent] AUTO waiting —", status.detail || na);
    await sleep(pollMs);
  }

  throw new Error("AUTO timeout after 6h");
}

async function main() {
  const args = parseArgs(process.argv);
  const keypair = loadKeypairSync();
  const wallet = keypair.publicKey.toBase58();
  const pollMs = args.pollMs ?? DEFAULT_POLL_MS;
  console.log("agent_wallet:", wallet);
  console.log("mcp:", MCP_URL);

  await mcpInit();

  if (args.mode === "status") {
    if (!args.fixture) throw new Error("--fixture required");
    await fetchAgentStatus(wallet, args.fixture, { verbose: true });
    return;
  }
  if (args.mode === "deposit") {
    if (!args.fixture || !args.outcome) throw new Error("--fixture and --outcome required");
    await cmdDeposit(keypair, args.fixture, args.outcome, args.amount ?? 1);
    return;
  }
  if (args.mode === "settle-claim" || args.mode === "recover") {
    if (!args.fixture) throw new Error("--fixture required");
    await cmdRecover(keypair, args.fixture, args.outcome);
    return;
  }
  if (args.mode === "auto") {
    if (!args.fixture || !args.outcome) throw new Error("--fixture and --outcome required");
    await cmdAuto(keypair, args.fixture, args.outcome, args.amount ?? 1, pollMs);
    return;
  }
  throw new Error(`unknown mode ${args.mode} — use auto | deposit | recover | status`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
