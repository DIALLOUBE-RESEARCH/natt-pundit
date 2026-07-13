import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

/** Load keeper fee-payer keypair from VPS env (never commit). */
export function loadKeeperKeypair() {
  const raw = process.env.ESCROW_KEEPER_KEYPAIR?.trim();
  if (!raw) {
    throw new Error("ESCROW_KEEPER_KEYPAIR missing — fund devnet SOL on VPS only");
  }
  try {
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    }
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    throw new Error("ESCROW_KEEPER_KEYPAIR invalid (base58 secret or JSON byte array)");
  }
}
