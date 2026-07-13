#!/usr/bin/env node
import { Connection, PublicKey } from "@solana/web3.js";

const WALLET =
  process.env.NATT_PUNDIT_DEMO_AGENT_WALLET || "2Kdxhz8yTR5e79VGr2zdeE7b6UY5hqBfaFu5g7uam4Qm";
const TARGET_SOL = Number(process.env.AGENT_AIRDROP_TARGET_SOL || 2);
const ATTEMPTS = Number(process.env.AGENT_AIRDROP_ATTEMPTS || 5);

const connection = new Connection(
  process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com",
  "confirmed",
);
const pubkey = new PublicKey(WALLET);

let sol = await connection.getBalance(pubkey);
console.log("[airdrop] before SOL:", sol / 1e9);

for (let i = 0; i < ATTEMPTS && sol < TARGET_SOL * 1e9; i += 1) {
  try {
    const sig = await connection.requestAirdrop(pubkey, 1e9);
    await connection.confirmTransaction(sig, "confirmed");
    sol = await connection.getBalance(pubkey);
    console.log(`[airdrop] ok ${i + 1} SOL=${(sol / 1e9).toFixed(4)} sig=${sig}`);
  } catch (err) {
    console.warn(`[airdrop] fail ${i + 1}:`, err instanceof Error ? err.message : err);
  }
  await new Promise((r) => setTimeout(r, 4000));
}

console.log("[airdrop] after SOL:", sol / 1e9);
