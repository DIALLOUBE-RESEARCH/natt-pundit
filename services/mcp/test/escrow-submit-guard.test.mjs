import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getEscrowProgramId } from "../escrow-agent.mjs";
import { assertEscrowSubmitAllowed } from "../escrow-submit-guard.mjs";

const DUMMY_BLOCKHASH = "11111111111111111111111111111111";

describe("escrow-submit-guard", () => {
  it("rejects foreign program instruction", () => {
    const kp = Keypair.generate();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: kp.publicKey,
        toPubkey: kp.publicKey,
        lamports: 1,
      }),
    );
    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = DUMMY_BLOCKHASH;
    const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    assert.throws(
      () => assertEscrowSubmitAllowed(bytes, getEscrowProgramId()),
      /submit_rejected_foreign_program/,
    );
  });

  it("allows compute budget instruction", () => {
    const kp = Keypair.generate();
    const escrowId = getEscrowProgramId();
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    );
    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = DUMMY_BLOCKHASH;
    const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    assert.doesNotThrow(() => assertEscrowSubmitAllowed(bytes, escrowId));
  });

  it("allows agent-shaped tx: compute budget + ATA create (F95N)", async () => {
    const { createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } =
      await import("@solana/spl-token");
    const kp = Keypair.generate();
    const mint = Keypair.generate().publicKey;
    const ata = getAssociatedTokenAddressSync(mint, kp.publicKey);
    const tx = new Transaction()
      .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }))
      .add(createAssociatedTokenAccountIdempotentInstruction(kp.publicKey, ata, kp.publicKey, mint));
    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = DUMMY_BLOCKHASH;
    const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    assert.doesNotThrow(() => assertEscrowSubmitAllowed(bytes, getEscrowProgramId()));
  });

  it("rejects direct SPL Token transfer (theft vector stays blocked)", async () => {
    const { createTransferInstruction, getAssociatedTokenAddressSync } = await import(
      "@solana/spl-token"
    );
    const kp = Keypair.generate();
    const mint = Keypair.generate().publicKey;
    const from = getAssociatedTokenAddressSync(mint, kp.publicKey);
    const to = getAssociatedTokenAddressSync(mint, Keypair.generate().publicKey);
    const tx = new Transaction().add(createTransferInstruction(from, to, kp.publicKey, 1n));
    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = DUMMY_BLOCKHASH;
    const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    assert.throws(
      () => assertEscrowSubmitAllowed(bytes, getEscrowProgramId()),
      /submit_rejected_foreign_program/,
    );
  });

  it("allows empty instruction list (edge)", () => {
    const kp = Keypair.generate();
    const tx = new Transaction();
    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = DUMMY_BLOCKHASH;
    const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    assert.doesNotThrow(() => assertEscrowSubmitAllowed(bytes, getEscrowProgramId()));
  });
});
