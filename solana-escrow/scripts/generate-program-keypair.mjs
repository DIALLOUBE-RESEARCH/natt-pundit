#!/usr/bin/env node
/**
 * Creates or reuses program keypair (gitignored). Prints pubkey for Anchor.toml / env.
 */
import { Keypair } from "@solana/web3.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deployDir = join(root, "target", "deploy");
const keyPath = join(deployDir, "natt_escrow-keypair.json");

mkdirSync(deployDir, { recursive: true });

let kp;
if (existsSync(keyPath)) {
  kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(keyPath, "utf8"))));
  console.error(`Reusing keypair at ${keyPath}`);
} else {
  kp = Keypair.generate();
  writeFileSync(keyPath, JSON.stringify(Array.from(kp.secretKey)));
  console.error(`Wrote new keypair to ${keyPath} (gitignored — back up locally)`);
}

console.log(kp.publicKey.toBase58());
