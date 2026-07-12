/**
 * F79N + F87 — whitelist guard for submit_signed_escrow_tx (escrow + compute budget).
 */
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

/** Solana compute budget program — required for settle CPI (1.4M CU). */
export const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111",
);

/**
 * SPL Associated Token Account program — deposit/claim/refund txs built by
 * `escrow-agent.mjs` prepend `createAssociatedTokenAccountIdempotentInstruction`
 * so the agent wallet always has its USDC ATA (F95N: without this entry the
 * whitelist rejects the agent's own transactions).
 */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

const ALLOWED_PROGRAM_IDS = new Set([ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()]);

export function isSubmitWhitelistEnabled(env = process.env) {
  const v = env.PUNDIT_ESCROW_SUBMIT_WHITELIST_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

export function isAllowedSubmitProgram(programId, escrowProgramId) {
  const pk = programId instanceof PublicKey ? programId : new PublicKey(programId);
  if (pk.equals(escrowProgramId)) return true;
  if (pk.equals(COMPUTE_BUDGET_PROGRAM_ID)) return true;
  return ALLOWED_PROGRAM_IDS.has(pk.toBase58());
}

export function decodeEscrowTransaction(bytes) {
  try {
    return Transaction.from(bytes);
  } catch {
    try {
      const vtx = VersionedTransaction.deserialize(bytes);
      const msg = vtx.message;
      const accountKeys = msg.staticAccountKeys.map((k) => k.toBase58());
      const instructions = msg.compiledInstructions.map((ix) => ({
        programId: accountKeys[ix.programIdIndex],
        data: Buffer.from(ix.data),
      }));
      return { versioned: true, instructions, feePayer: accountKeys[0] };
    } catch {
      throw new Error("signed_transaction_decode_failed");
    }
  }
}

/**
 * @param {Buffer} bytes
 * @param {PublicKey} escrowProgramId
 */
export function assertEscrowSubmitAllowed(bytes, escrowProgramId) {
  const decoded = decodeEscrowTransaction(bytes);
  if (decoded instanceof Transaction) {
    for (const ix of decoded.instructions) {
      if (!isAllowedSubmitProgram(ix.programId, escrowProgramId)) {
        throw new Error(
          `submit_rejected_foreign_program:${ix.programId.toBase58()}`,
        );
      }
    }
    return;
  }
  for (const ix of decoded.instructions) {
    if (!isAllowedSubmitProgram(ix.programId, escrowProgramId)) {
      throw new Error(`submit_rejected_foreign_program:${ix.programId}`);
    }
  }
}
