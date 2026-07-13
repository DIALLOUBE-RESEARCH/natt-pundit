import { PublicKey } from "@solana/web3.js";

/** Strip CAIP-10 (`solana:chain:pubkey`) and validate base58 pubkey. */
export function normalizeSolanaAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = trimmed.includes(":") ? (trimmed.split(":").pop() ?? "") : trimmed;
  if (!candidate) return null;
  try {
    return new PublicKey(candidate).toBase58();
  } catch {
    return null;
  }
}
