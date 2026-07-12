#!/usr/bin/env node
/**
 * F74N — Autonomous Natt Pundit agent via CDP Server Wallet (Solana devnet).
 * No private key export — signing through Coinbase CDP API (TEE).
 *
 * Usage (VPS — CDP_API_KEY_* + CDP_WALLET_SECRET in env):
 *   node scripts/natt-agent-cdp-autonomous.mjs status --fixture 18179551
 *   node scripts/natt-agent-cdp-autonomous.mjs deposit --fixture 18179551 --outcome home --amount 1
 *   node scripts/natt-agent-cdp-autonomous.mjs auto --fixture 18179763 --outcome home
 *   node scripts/natt-agent-cdp-autonomous.mjs recover --fixture 18179763
 *
 * Env:
 *   CDP_API_KEY_ID / CDP_API_KEY_SECRET / CDP_WALLET_SECRET  (VPS ~/HYPERNATT/.env)
 *   NATT_PUNDIT_CDP_SOLANA_ADDRESS   optional — reuse existing CDP Solana account
 *   NATT_PUNDIT_CDP_SOLANA_NAME      default natt-pundit-agent
 *   NATT_PUNDIT_MCP_URL              default prod MCP
 */
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Agent, fetch as undiciFetch } from "undici";

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

function makeRpcFetch(strictTls) {
  if (strictTls) return fetch;
  return (url, init) => undiciFetch(url, { ...init, dispatcher: insecureDispatcher });
}

async function rpcConnection() {
  const url = process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com";
  try {
    const conn = new Connection(url, { commitment: "confirmed", fetch: makeRpcFetch(true) });
    await conn.getVersion();
    return conn;
  } catch {
    return new Connection(url, { commitment: "confirmed", fetch: makeRpcFetch(false) });
  }
}
const USDC_MINT = new PublicKey(
  process.env.PUNDIT_X402_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
const DEFAULT_DEPOSIT_USDC = 1;
const CDP_ACCOUNT_NAME = process.env.NATT_PUNDIT_CDP_SOLANA_NAME || "natt-pundit-agent";
const DEFAULT_POLL_MS = Number(process.env.AGENT_POLL_MS || 30_000);
const PAYOUT_ACTIONS = new Set(["refund", "refund_all", "settle", "claim"]);
const TERMINAL_ACTIONS = new Set(["done", "none"]);

let sessionId = null;
let rpcId = 1;

async function getCdp() {
  const { CdpClient } = await import("@coinbase/cdp-sdk");
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  const walletSecret = process.env.CDP_WALLET_SECRET;
  if (!apiKeyId || !apiKeySecret || !walletSecret) {
    throw new Error("CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET required (VPS .env)");
  }
  return new CdpClient({ apiKeyId, apiKeySecret, walletSecret });
}

const MCP_URL = process.env.NATT_PUNDIT_MCP_URL || "https://hypernatt.com/mcp-pundit/protocol";

async function resolveCdpSolanaAddress(cdp) {
  const pinned = process.env.NATT_PUNDIT_CDP_SOLANA_ADDRESS?.trim();
  if (pinned) return pinned;

  try {
    const existing = await cdp.solana.getAccount({ name: CDP_ACCOUNT_NAME });
    const addr =
      typeof existing?.address === "string"
        ? existing.address
        : String(existing?.address ?? "").trim();
    if (addr) {
      console.log(`[cdp] reuse account name=${CDP_ACCOUNT_NAME} address=${addr}`);
      return addr;
    }
  } catch {
    /* create below */
  }

  const created = await cdp.solana.createAccount({ name: CDP_ACCOUNT_NAME });
  const addr =
    typeof created?.address === "string" ? created.address : String(created?.address ?? "").trim();
  if (!addr) throw new Error("CDP createAccount returned no address");
  console.log(`[cdp] created Solana devnet account name=${CDP_ACCOUNT_NAME} address=${addr}`);
  console.log(`[cdp] pin in VPS: NATT_PUNDIT_CDP_SOLANA_ADDRESS=${addr}`);
  return addr;
}

async function ensureDevnetFunds(cdp, address) {
  const connection = await rpcConnection();
  const pubkey = new PublicKey(address);

  let sol = await connection.getBalance(pubkey);
  const minSol = 5_000_000;
  for (let attempt = 0; sol < minSol && attempt < 5; attempt += 1) {
    console.log(`[cdp] requesting SOL devnet faucet (attempt ${attempt + 1})…`);
    try {
      await cdp.solana.requestFaucet({ address, token: "sol" });
    } catch (err) {
      console.warn("[cdp] SOL faucet:", err instanceof Error ? err.message : err);
    }
    await sleep(5000);
    sol = await connection.getBalance(pubkey);
  }
  console.log(`[cdp] SOL balance: ${(sol / 1e9).toFixed(4)}`);
  if (sol < minSol) {
    console.warn(`[cdp] low SOL (${sol} lamports) — deposit may fail on OpenPosition rent`);
  }

  const ata = getAssociatedTokenAddressSync(USDC_MINT, pubkey);
  let usdc = 0;
  try {
    const bal = await connection.getTokenAccountBalance(ata);
    usdc = Number(bal.value.uiAmountString || 0);
  } catch {
    usdc = 0;
  }
  console.log(`[cdp] USDC devnet balance: ${usdc}`);

  if (usdc < DEFAULT_DEPOSIT_USDC) {
    console.log("[cdp] trying USDC devnet faucet…");
    try {
      await cdp.solana.requestFaucet({ address, token: "usdc" });
      await sleep(3000);
      const bal = await connection.getTokenAccountBalance(ata);
      usdc = Number(bal.value.uiAmountString || 0);
      console.log(`[cdp] USDC after faucet: ${usdc}`);
    } catch (err) {
      console.warn(
        "[cdp] USDC faucet failed — fund manually:",
        err instanceof Error ? err.message : err,
      );
      console.warn(
        `[cdp] Circle devnet → send USDC to ${address} (mint ${USDC_MINT.toBase58()})`,
      );
    }
  }

  return { sol, usdc };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
      clientInfo: { name: "natt-agent-cdp", version: "0.1.0" },
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

async function signWithCdp(cdp, address, unsignedBase64) {
  const connection = await rpcConnection();
  const tx = Transaction.from(Buffer.from(unsignedBase64, "base64"));
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  if (!tx.feePayer) {
    tx.feePayer = new PublicKey(address);
  }
  const serialized = Buffer.from(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  ).toString("base64");

  const result = await cdp.solana.signTransaction({
    address,
    transaction: serialized,
  });

  const signed =
    result?.signedTransaction ||
    result?.signature ||
    result?.transaction ||
    (typeof result === "string" ? result : null);
  if (!signed || typeof signed !== "string") {
    throw new Error(`CDP signTransaction unexpected response: ${JSON.stringify(result)}`);
  }
  return signed;
}

async function broadcastSigned(signedBase64) {
  const connection = await rpcConnection();
  const bytes = Buffer.from(signedBase64, "base64");
  const sig = await connection.sendRawTransaction(bytes, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return {
    tx_signature: sig,
    explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
  };
}

async function submitSigned(signedBase64, agentWallet) {
  try {
    return await broadcastSigned(signedBase64);
  } catch (localErr) {
    console.warn("[broadcast] local RPC failed, fallback MCP:", localErr.message || localErr);
    return callTool("submit_signed_escrow_tx", {
      signed_transaction_base64: signedBase64,
      agent_wallet: agentWallet,
    });
  }
}

function parseArgs(argv) {
  const out = { mode: argv[2] || "status" };
  for (let i = 3; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--fixture") out.fixture = argv[++i];
    else if (a === "--outcome") out.outcome = argv[++i];
    else if (a === "--amount") out.amount = Number(argv[++i]);
    else if (a === "--poll-ms") out.pollMs = Number(argv[++i]);
    else if (a === "--force") out.force = true;
  }
  return out;
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
      `[cdp-agent] fixture=${fixtureId} match=${fx} next=${status.next_action} pool=${status.pool_mode}`,
    );
  }
  return status;
}

async function runPayoutAction(cdp, address, fixtureId, status, outcome) {
  const na = status.next_action;
  const out = outcome || status.suggested_outcome || "home";

  if (na === "refund") {
    const built = await callTool("build_escrow_refund_tx", {
      fixture_id: fixtureId,
      agent_wallet: address,
    });
    const signed = await signWithCdp(cdp, address, built.transaction_base64);
    const sub = await submitSigned(signed, address);
    console.log("[cdp-agent] refund tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  if (na === "refund_all") {
    const built = await callTool("build_escrow_refund_all_tx", {
      fixture_id: fixtureId,
      agent_wallet: address,
    });
    const signed = await signWithCdp(cdp, address, built.transaction_base64);
    const sub = await submitSigned(signed, address);
    console.log("[cdp-agent] refund_all tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  if (na === "settle") {
    const settleOutcome = status.suggested_outcome || out;
    const cpi = await callTool("get_cpi_settle_args", {
      fixture_id: fixtureId,
      outcome: settleOutcome,
      agent_wallet: address,
    });
    const built = await callTool("build_escrow_settle_tx", {
      fixture_id: fixtureId,
      outcome: settleOutcome,
      agent_wallet: address,
      cpi_args: cpi.cpi_args,
    });
    const signed = await signWithCdp(cdp, address, built.transaction_base64);
    const sub = await submitSigned(signed, address);
    console.log("[cdp-agent] settle tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  if (na === "claim") {
    const built = await callTool("build_escrow_claim_tx", {
      fixture_id: fixtureId,
      agent_wallet: address,
    });
    const signed = await signWithCdp(cdp, address, built.transaction_base64);
    const sub = await submitSigned(signed, address);
    console.log("[cdp-agent] claim tx:", sub.tx_signature, sub.explorer_url || "");
    return true;
  }

  return false;
}

async function cmdDeposit(cdp, address, fixtureId, outcome, amountUsdc, { force = false } = {}) {
  await ensureDevnetFunds(cdp, address);

  let status = await fetchAgentStatus(address, fixtureId);

  if (status.next_action === "create_pool") {
    const fixtures = await callTool("get_wc_fixtures", { limit: 50 });
    const fx = fixtures.data?.fixtures?.find((f) => f.fixtureId === fixtureId);
    if (!fx?.kickoffAt) throw new Error("fixture kickoff not found for create_pool");
    const built = await callTool("build_escrow_create_pool_tx", {
      fixture_id: fixtureId,
      kickoff_at: fx.kickoffAt,
      agent_wallet: address,
    });
    const signed = await signWithCdp(cdp, address, built.transaction_base64);
    const sub = await submitSigned(signed, address);
    console.log("[cdp-agent] create_pool tx:", sub.tx_signature, sub.explorer_url || "");
    await sleep(2000);
    status = await fetchAgentStatus(address, fixtureId);
  }

  if (status.next_action !== "deposit") {
    if (Number(status.position?.amount || 0) > 0) {
      console.log("[cdp-agent] skip deposit — positioned, next:", status.next_action);
      return status;
    }
    if (!force) {
      console.log("[cdp-agent] skip deposit — next:", status.next_action);
      return status;
    }
    console.warn(
      `[cdp-agent] --force deposit despite next_action=${status.next_action} (owner demo counterparty)`,
    );
  }

  const built = await callTool("build_escrow_deposit_tx", {
    fixture_id: fixtureId,
    outcome,
    amount_usdc: amountUsdc,
    agent_wallet: address,
  });
  const signed = await signWithCdp(cdp, address, built.transaction_base64);
  const sub = await submitSigned(signed, address);
  console.log(`[cdp-agent] deposit ${amountUsdc} USDC:`, sub.tx_signature, sub.explorer_url || "");
  await sleep(2000);
  return fetchAgentStatus(address, fixtureId);
}

async function cmdRecover(cdp, address, fixtureId, outcome) {
  for (let step = 0; step < 8; step += 1) {
    const status = await fetchAgentStatus(address, fixtureId);
    const na = status.next_action;
    if (TERMINAL_ACTIONS.has(na)) {
      console.log("[cdp-agent] done —", status.detail || status.reason || na);
      return status;
    }
    if (!PAYOUT_ACTIONS.has(na)) {
      console.log("[cdp-agent] stopped —", status.detail || na);
      return status;
    }
    await runPayoutAction(cdp, address, fixtureId, status, outcome);
    await sleep(3000);
    const after = await fetchAgentStatus(address, fixtureId);
    if (TERMINAL_ACTIONS.has(after.next_action) || after.position?.claimed) {
      console.log("[cdp-agent] done —", after.detail || after.reason || after.next_action);
      return after;
    }
  }
  throw new Error("recover: max steps exceeded");
}

async function cmdAuto(cdp, address, fixtureId, outcome, amountUsdc, pollMs) {
  console.log("[cdp-agent] AUTO start", { fixtureId, outcome, amountUsdc, pollMs });

  let status = await fetchAgentStatus(address, fixtureId);
  if (status.next_action === "create_pool" || status.next_action === "deposit") {
    status = await cmdDeposit(cdp, address, fixtureId, outcome, amountUsdc);
  }

  const deadline = Date.now() + 6 * 60 * 60 * 1000;
  while (Date.now() < deadline) {
    status = await fetchAgentStatus(address, fixtureId);
    const na = status.next_action;

    if (TERMINAL_ACTIONS.has(na)) {
      console.log("[cdp-agent] AUTO complete —", status.detail || status.reason || na);
      return status;
    }

    if (PAYOUT_ACTIONS.has(na)) {
      await runPayoutAction(cdp, address, fixtureId, status, outcome);
      await sleep(4000);
      continue;
    }

    if (na === "wait_match") {
      await sleep(pollMs);
      continue;
    }

    if (na === "create_pool" || na === "deposit") {
      status = await cmdDeposit(cdp, address, fixtureId, outcome, amountUsdc);
      await sleep(2000);
      continue;
    }

    console.log("[cdp-agent] AUTO waiting —", status.detail || na);
    await sleep(pollMs);
  }

  throw new Error("AUTO timeout after 6h");
}

async function main() {
  const args = parseArgs(process.argv);
  const amountUsdc = args.amount ?? DEFAULT_DEPOSIT_USDC;
  const pollMs = args.pollMs ?? DEFAULT_POLL_MS;

  const cdp = await getCdp();
  const address = await resolveCdpSolanaAddress(cdp);
  console.log("cdp_solana_agent:", address);
  console.log("mcp:", MCP_URL);

  await mcpInit();

  if (args.mode === "status") {
    if (!args.fixture) throw new Error("--fixture required");
    await fetchAgentStatus(address, args.fixture, { verbose: true });
    return;
  }
  if (args.mode === "deposit") {
    if (!args.fixture || !args.outcome) throw new Error("--fixture and --outcome required");
    await cmdDeposit(cdp, address, args.fixture, args.outcome, amountUsdc, { force: args.force });
    return;
  }
  if (args.mode === "settle-claim" || args.mode === "recover") {
    if (!args.fixture) throw new Error("--fixture required");
    await cmdRecover(cdp, address, args.fixture, args.outcome);
    return;
  }
  if (args.mode === "auto") {
    if (!args.fixture || !args.outcome) throw new Error("--fixture and --outcome required");
    await cmdAuto(cdp, address, args.fixture, args.outcome, amountUsdc, pollMs);
    return;
  }
  throw new Error(`unknown mode ${args.mode} — use auto | deposit | recover | status`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
