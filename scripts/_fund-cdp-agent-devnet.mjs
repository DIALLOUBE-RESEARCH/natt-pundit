#!/usr/bin/env node
/**
 * One-shot: max CDP devnet faucet for Natt Pundit demo agent wallet.
 * Run on VPS: docker run --rm -v ~/HYPERNATT/hackathon/natt-pundit:/work -w /work \
 *   --env-file ~/HYPERNATT/.env node:22-alpine sh -lc \
 *   'npm i @coinbase/cdp-sdk @solana/web3.js @solana/spl-token undici -q && node scripts/_fund-cdp-agent-devnet.mjs'
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Agent, fetch as undiciFetch } from "undici";

const USDC_MINT = new PublicKey(
  process.env.PUNDIT_X402_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
const TARGET_SOL = Number(process.env.AGENT_FUND_TARGET_SOL || 5);
const TARGET_USDC = Number(process.env.AGENT_FUND_TARGET_USDC || 100);
const MAX_SOL_ATTEMPTS = Number(process.env.AGENT_FUND_MAX_SOL_ATTEMPTS || 20);
const MAX_USDC_ATTEMPTS = Number(process.env.AGENT_FUND_MAX_USDC_ATTEMPTS || 15);
const CDP_ACCOUNT_NAME = process.env.NATT_PUNDIT_CDP_SOLANA_NAME || "natt-pundit-agent";

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rpcConnection() {
  const url = process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com";
  try {
    const conn = new Connection(url, { commitment: "confirmed", fetch: globalThis.fetch });
    await conn.getVersion();
    return conn;
  } catch {
    return new Connection(url, {
      commitment: "confirmed",
      fetch: (u, init) => undiciFetch(u, { ...init, dispatcher: insecureDispatcher }),
    });
  }
}

async function getCdp() {
  const { CdpClient } = await import("@coinbase/cdp-sdk");
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  const walletSecret = process.env.CDP_WALLET_SECRET;
  if (!apiKeyId || !apiKeySecret || !walletSecret) {
    throw new Error("CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET required");
  }
  return new CdpClient({ apiKeyId, apiKeySecret, walletSecret });
}

async function resolveAddress(cdp) {
  const pinned =
    process.env.NATT_PUNDIT_CDP_SOLANA_ADDRESS?.trim() ||
    process.env.NATT_PUNDIT_DEMO_AGENT_WALLET?.trim();
  if (pinned) return pinned;

  const existing = await cdp.solana.getAccount({ name: CDP_ACCOUNT_NAME });
  const addr =
    typeof existing?.address === "string"
      ? existing.address
      : String(existing?.address ?? "").trim();
  if (!addr) throw new Error("no CDP solana address");
  return addr;
}

async function readBalances(connection, pubkey) {
  const sol = await connection.getBalance(pubkey);
  let usdc = 0;
  try {
    const ata = getAssociatedTokenAddressSync(USDC_MINT, pubkey);
    const bal = await connection.getTokenAccountBalance(ata);
    usdc = Number(bal.value.uiAmountString || 0);
  } catch {
    usdc = 0;
  }
  return { sol, usdc };
}

async function fundSol(cdp, connection, address, pubkey) {
  const targetLamports = TARGET_SOL * 1e9;
  let attempts = 0;
  let lastSol = 0;

  while (attempts < MAX_SOL_ATTEMPTS) {
    const { sol } = await readBalances(connection, pubkey);
    lastSol = sol;
    if (sol >= targetLamports) break;

    attempts += 1;
    console.log(
      `[fund] SOL faucet attempt ${attempts}/${MAX_SOL_ATTEMPTS} (have ${(sol / 1e9).toFixed(4)}, target ${TARGET_SOL})`,
    );
    try {
      await cdp.solana.requestFaucet({ address, token: "sol" });
    } catch (err) {
      console.warn("[fund] SOL faucet error:", err instanceof Error ? err.message : err);
    }
    await sleep(6000);
  }

  const finalSol = (await readBalances(connection, pubkey)).sol;
  console.log(`[fund] SOL final: ${(finalSol / 1e9).toFixed(4)} (was ${(lastSol / 1e9).toFixed(4)})`);
  return finalSol;
}

async function fundUsdc(cdp, connection, address, pubkey) {
  let attempts = 0;
  let lastUsdc = 0;

  while (attempts < MAX_USDC_ATTEMPTS) {
    const { usdc } = await readBalances(connection, pubkey);
    lastUsdc = usdc;
    if (usdc >= TARGET_USDC) break;

    attempts += 1;
    console.log(
      `[fund] USDC faucet attempt ${attempts}/${MAX_USDC_ATTEMPTS} (have ${usdc}, target ${TARGET_USDC})`,
    );
    try {
      await cdp.solana.requestFaucet({ address, token: "usdc" });
    } catch (err) {
      console.warn("[fund] USDC faucet error:", err instanceof Error ? err.message : err);
    }
    await sleep(6000);
  }

  const finalUsdc = (await readBalances(connection, pubkey)).usdc;
  console.log(`[fund] USDC final: ${finalUsdc} (was ${lastUsdc})`);
  return finalUsdc;
}

async function main() {
  const cdp = await getCdp();
  const address = await resolveAddress(cdp);
  const connection = await rpcConnection();
  const pubkey = new PublicKey(address);

  const before = await readBalances(connection, pubkey);
  console.log("[fund] wallet:", address);
  console.log("[fund] before:", { sol: before.sol / 1e9, usdc: before.usdc });

  await fundSol(cdp, connection, address, pubkey);
  await fundUsdc(cdp, connection, address, pubkey);

  const after = await readBalances(connection, pubkey);
  console.log(
    JSON.stringify(
      {
        wallet: address,
        before: { sol: before.sol / 1e9, usdc: before.usdc },
        after: { sol: after.sol / 1e9, usdc: after.usdc },
        targets: { sol: TARGET_SOL, usdc: TARGET_USDC },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
