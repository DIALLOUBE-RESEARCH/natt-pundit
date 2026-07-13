/**
 * F72N v1.5 — Unsigned escrow txs for autonomous agents (no private keys on server).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import anchor from "@coral-xyz/anchor";
const { BN, Program } = anchor;
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import axios from "axios";
import {
  getEscrowConnection,
  invalidateEscrowRpcCache,
  resolveEscrowRpcUrl,
} from "./solana-rpc.mjs";
import {
  assertEscrowSubmitAllowed,
  isSubmitWhitelistEnabled,
} from "./escrow-submit-guard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GATEWAY = process.env.PUNDIT_GATEWAY_URL || "http://natt-pundit-gateway:4001";
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const TXLINE_DEVNET_PROGRAM = "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J";
const MIN_DEPOSIT_BASE = 10_000n;
const MIN_DEPOSIT_USDC = 0.01;

let cachedIdl;

function loadEscrowIdl() {
  if (cachedIdl) return cachedIdl;
  const path = join(__dirname, "idl", "natt_escrow.json");
  cachedIdl = JSON.parse(readFileSync(path, "utf8"));
  return cachedIdl;
}

export function getEscrowProgramId() {
  const raw =
    process.env.NATT_ESCROW_PROGRAM_ID?.trim() ||
    process.env.NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID?.trim() ||
    "GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD";
  return new PublicKey(raw);
}

export async function escrowRpcUrl() {
  return resolveEscrowRpcUrl();
}

/** @deprecated use getEscrowConnection */
export async function escrowConnection() {
  return getEscrowConnection();
}

function fixtureIdLeBytes(fixtureId) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(fixtureId));
  return buf;
}

export function poolPda(programId, fixtureId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), fixtureIdLeBytes(fixtureId)],
    programId,
  );
  return pda;
}

export function vaultPda(programId, fixtureId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), fixtureIdLeBytes(fixtureId)],
    programId,
  );
  return pda;
}

export function positionPda(programId, pool, owner) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), pool.toBuffer(), owner.toBuffer()],
    programId,
  );
  return pda;
}

function parsePoolAccountBytes(data) {
  const bytes = new Uint8Array(data);
  if (bytes.length < 92) {
    return {
      exists: true,
      settled: false,
      winningSide: 255,
      totalDeposited: 0n,
      sideTotals: [0n, 0n, 0n],
      kickoffTs: 0,
    };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    exists: true,
    settled: bytes[56] !== 0,
    winningSide: bytes[57],
    totalDeposited: view.getBigUint64(58, true),
    sideTotals: [
      view.getBigUint64(66, true),
      view.getBigUint64(74, true),
      view.getBigUint64(82, true),
    ],
    kickoffTs: Number(view.getBigInt64(48, true)),
  };
}

function poolToJson(s) {
  return {
    exists: s.exists,
    settled: s.settled,
    winningSide: s.winningSide,
    totalDeposited: s.totalDeposited.toString(),
    sideTotals: s.sideTotals.map(String),
    kickoffTs: s.kickoffTs,
  };
}

export function requireAgentWallet(agentWallet) {
  const w = typeof agentWallet === "string" ? agentWallet.trim() : "";
  if (!w) throw new Error("agent_wallet_required: Solana pubkey base58 (fee payer + signer).");
  try {
    return new PublicKey(w);
  } catch {
    throw new Error("agent_wallet_invalid: expected base58 Solana pubkey.");
  }
}

/** Returns null when omitted — analysis-only MCP calls (F92N-AX). */
export function parseOptionalAgentWallet(agentWallet) {
  const w = typeof agentWallet === "string" ? agentWallet.trim() : "";
  if (!w) return null;
  try {
    return new PublicKey(w);
  } catch {
    throw new Error("agent_wallet_invalid: expected base58 Solana pubkey.");
  }
}

function outcomeToSide(outcome) {
  const o = String(outcome).toLowerCase();
  if (o === "home") return 0;
  if (o === "draw") return 1;
  if (o === "away") return 2;
  throw new Error("outcome must be home|draw|away");
}

function dummyProvider(connection, user) {
  const wallet = {
    publicKey: user,
    signTransaction: async (t) => t,
    signAllTransactions: async (ts) => ts,
  };
  return new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

function escrowProgram(connection, user, programId) {
  const idl = { ...loadEscrowIdl(), address: programId.toBase58() };
  return new Program(idl, dummyProvider(connection, user));
}

async function serializeUnsignedTx(connection, tx, feePayer) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = feePayer;
  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  return {
    transaction_base64: serialized.toString("base64"),
    recent_blockhash: blockhash,
    last_valid_block_height: lastValidBlockHeight,
    fee_payer: feePayer.toBase58(),
    sign_locally_hint:
      "Sign with agent wallet (Phantom devnet / CDP SVM / keypair) then broadcast via sendTransaction.",
    explorer_cluster: "devnet",
  };
}

export async function fetchEscrowPool(fixtureId) {
  const programId = getEscrowProgramId();
  const connection = await getEscrowConnection();
  const poolKey = poolPda(programId, fixtureId);
  const info = await connection.getAccountInfo(poolKey);
  if (!info?.data) {
    return {
      ok: true,
      fixture_id: fixtureId,
      program_id: programId.toBase58(),
      pool_pda: poolKey.toBase58(),
      pool: poolToJson({
        exists: false,
        settled: false,
        winningSide: 255,
        totalDeposited: 0n,
        sideTotals: [0n, 0n, 0n],
        kickoffTs: 0,
      }),
    };
  }
  const parsed = parsePoolAccountBytes(info.data);
  try {
    const vault = vaultPda(programId, fixtureId);
    const vb = await connection.getTokenAccountBalance(vault);
    parsed.totalDeposited = BigInt(vb.value.amount);
  } catch {
    /* keep */
  }
  return {
    ok: true,
    fixture_id: fixtureId,
    program_id: programId.toBase58(),
    pool_pda: poolKey.toBase58(),
    vault_pda: vaultPda(programId, fixtureId).toBase58(),
    pool: poolToJson(parsed),
  };
}

export async function fetchCpiSettleArgs(fixtureId, outcome) {
  const { data } = await axios.get(
    `${GATEWAY}/v1/fixtures/${fixtureId}/cpi-args?outcome=${outcome}`,
    { timeout: 20000 },
  );
  return data;
}

export async function buildCreatePoolTx({ fixture_id, kickoff_at, agent_wallet }) {
  const user = requireAgentWallet(agent_wallet);
  const programId = getEscrowProgramId();
  const kickoffTs = Math.floor(Date.parse(kickoff_at) / 1000);
  if (!Number.isFinite(kickoffTs)) throw new Error("invalid_kickoff_at: ISO datetime required.");

  const connection = await getEscrowConnection();
  const program = escrowProgram(connection, user, programId);
  const pool = poolPda(programId, fixture_id);
  const vault = vaultPda(programId, fixture_id);
  const usdcMint = new PublicKey(USDC_DEVNET_MINT);

  const ix = await program.methods
    .createPool(new BN(BigInt(fixture_id).toString()), new BN(kickoffTs))
    .accounts({
      authority: user,
      usdcMint,
      pool,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  const body = await serializeUnsignedTx(connection, tx, user);
  return {
    ok: true,
    fixture_id,
    action: "create_pool",
    program_id: programId.toBase58(),
    pool_pda: pool.toBase58(),
    ...body,
  };
}

export function parsePositionSideFromData(data) {
  if (!data || data.length < 73) return null;
  return data[72];
}

export async function buildDepositTx({ fixture_id, outcome, amount_usdc, agent_wallet }) {
  const user = requireAgentWallet(agent_wallet);
  const side = outcomeToSide(outcome);
  const amountBase = BigInt(Math.round(Number(amount_usdc) * 1_000_000));
  if (amountBase < MIN_DEPOSIT_BASE) {
    throw new Error(`min_deposit_${MIN_DEPOSIT_USDC}_usdc`);
  }

  const programId = getEscrowProgramId();
  const connection = await getEscrowConnection();
  const program = escrowProgram(connection, user, programId);
  const pool = poolPda(programId, fixture_id);
  const vault = vaultPda(programId, fixture_id);
  const position = positionPda(programId, pool, user);
  const usdcMint = new PublicKey(USDC_DEVNET_MINT);
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user);

  const positionInfo = await connection.getAccountInfo(position);
  const tx = new Transaction();
  tx.add(createAssociatedTokenAccountIdempotentInstruction(user, userUsdc, user, usdcMint));

  if (positionInfo) {
    const existingSide = parsePositionSideFromData(positionInfo.data);
    if (existingSide !== null && existingSide !== side) {
      throw new Error("side_mismatch_existing_position: agent already has position on another side.");
    }
  } else {
    const openIx = await program.methods
      .openPosition(side)
      .accountsStrict({
        depositor: user,
        pool,
        position,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    tx.add(openIx);
  }

  const depositIx = await program.methods
    .deposit(new BN(amountBase.toString()))
    .accountsStrict({
      depositor: user,
      pool,
      vault,
      position,
      depositorTokenAccount: userUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  tx.add(depositIx);

  const body = await serializeUnsignedTx(connection, tx, user);
  return {
    ok: true,
    fixture_id,
    outcome,
    side,
    amount_usdc: Number(amount_usdc),
    amount_base: amountBase.toString(),
    action: "deposit",
    program_id: programId.toBase58(),
    pool_pda: pool.toBase58(),
    position_pda: position.toBase58(),
    agent_wallet: user.toBase58(),
    x402_note: "MCP x402 pays API access only; this tx moves USDC devnet from agent wallet to escrow vault.",
    ...body,
  };
}

function toBytes32(arr) {
  if (arr.length !== 32) throw new Error(`expected 32 bytes, got ${arr.length}`);
  return Buffer.from(arr);
}

function toProofNodes(nodes) {
  return nodes.map((n) => ({
    hash: Array.from(toBytes32(n.hash)),
    isRightSibling: n.isRightSibling,
  }));
}

function cpiPath(obj, path) {
  return path.split(".").reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);
}

/** Fail-fast validation so agents get explicit errors instead of undefined crashes. */
export function validateCpiSettleArgs(cpi_args) {
  if (!cpi_args || typeof cpi_args !== "object" || Array.isArray(cpi_args)) {
    throw new Error(
      "cpi_args required: pass the full JSON object returned by get_cpi_settle_args (field cpi_args), not a partial excerpt.",
    );
  }

  const requiredPaths = [
    "targetTs",
    "fixtureSummary.fixtureId",
    "fixtureSummary.updateStats.updateCount",
    "fixtureSummary.updateStats.minTimestamp",
    "fixtureSummary.updateStats.maxTimestamp",
    "fixtureSummary.eventsSubTreeRoot",
    "mainTreeProof",
    "predicate",
    "stat1.statToProve",
    "stat1.eventStatRoot",
    "stat1.statProof",
    "dailyScoresPdaSeeds.seeds",
  ];

  for (const path of requiredPaths) {
    const value = cpiPath(cpi_args, path);
    if (value === undefined || value === null) {
      throw new Error(
        `cpi_args.${path} missing — re-call get_cpi_settle_args and pass the complete cpi_args object to build_escrow_settle_tx.`,
      );
    }
  }

  for (const listPath of ["mainTreeProof", "stat1.statProof"]) {
    const value = cpiPath(cpi_args, listPath);
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(
        `cpi_args.${listPath} must be a non-empty array from get_cpi_settle_args.`,
      );
    }
  }

  const fixtureProof = cpi_args.fixtureProof;
  if (fixtureProof !== undefined && fixtureProof !== null && !Array.isArray(fixtureProof)) {
    throw new Error("cpi_args.fixtureProof must be an array (may be empty for some fixtures).");
  }

  const seeds = cpi_args.dailyScoresPdaSeeds.seeds;
  if (!Array.isArray(seeds) || seeds.length < 2 || seeds[1] == null) {
    throw new Error("cpi_args.dailyScoresPdaSeeds.seeds[1] missing — use get_cpi_settle_args output as-is.");
  }

  return cpi_args;
}

export async function buildTxlineValidateStatIxData(connection, user, args, txlineProgramPk) {
  validateCpiSettleArgs(args);
  const txlineIdlPath = join(__dirname, "idl", "txline.json");
  const txlineIdl = JSON.parse(readFileSync(txlineIdlPath, "utf8"));
  const idl = { ...txlineIdl, address: txlineProgramPk.toBase58() };
  const program = new Program(idl, dummyProvider(connection, user));

  const fixtureSummary = {
    fixtureId: new BN(args.fixtureSummary.fixtureId),
    updateStats: {
      updateCount: args.fixtureSummary.updateStats.updateCount,
      minTimestamp: new BN(args.fixtureSummary.updateStats.minTimestamp),
      maxTimestamp: new BN(args.fixtureSummary.updateStats.maxTimestamp),
    },
    eventsSubTreeRoot: Array.from(toBytes32(args.fixtureSummary.eventsSubTreeRoot)),
  };

  const stat1 = {
    statToProve: args.stat1.statToProve,
    eventStatRoot: Array.from(toBytes32(args.stat1.eventStatRoot)),
    statProof: toProofNodes(args.stat1.statProof),
  };
  const stat2 = args.stat2
    ? {
        statToProve: args.stat2.statToProve,
        eventStatRoot: Array.from(toBytes32(args.stat2.eventStatRoot)),
        statProof: toProofNodes(args.stat2.statProof),
      }
    : null;

  const dayLe = Buffer.from(args.dailyScoresPdaSeeds.seeds[1]);
  const [dailyScoresPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("daily_scores_roots"), dayLe],
    txlineProgramPk,
  );

  const fixtureProof = args.fixtureProof ?? [];
  const ix = await program.methods
    .validateStat(
      new BN(args.targetTs),
      fixtureSummary,
      toProofNodes(fixtureProof),
      toProofNodes(args.mainTreeProof),
      args.predicate,
      stat1,
      stat2,
      args.op,
    )
    .accounts({ dailyScoresMerkleRoots: dailyScoresPda })
    .instruction();

  return { ixData: Buffer.from(ix.data), dailyScoresPda };
}

export async function buildSettleTx({ fixture_id, outcome, agent_wallet, cpi_args }) {
  const user = requireAgentWallet(agent_wallet);
  const programId = getEscrowProgramId();
  const connection = await getEscrowConnection();
  const program = escrowProgram(connection, user, programId);
  const pool = poolPda(programId, fixture_id);
  const txlinePk = new PublicKey(cpi_args?.txlineProgramId || TXLINE_DEVNET_PROGRAM);

  // F95N security: only CPI-proven settles. The former knockout_tab mode (client-asserted
  // pen winner) was removed — shootout winners settle via standard args on pen-goal stats.
  if (cpi_args?.settleMode && cpi_args.settleMode !== "standard") {
    throw new Error(
      `unsupported_settle_mode_${cpi_args.settleMode}: winning side must be proven by TxLINE CPI`,
    );
  }

  validateCpiSettleArgs(cpi_args);
  const { ixData, dailyScoresPda } = await buildTxlineValidateStatIxData(
    connection,
    user,
    cpi_args,
    txlinePk,
  );

  const settleIx = await program.methods
    .settle(ixData)
    .accounts({
      pool,
      dailyScoresMerkleRoots: dailyScoresPda,
      txlineProgram: txlinePk,
    })
    .instruction();

  const tx = new Transaction()
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }))
    .add(settleIx);
  const body = await serializeUnsignedTx(connection, tx, user);
  return {
    ok: true,
    fixture_id,
    outcome,
    action: "settle",
    ...body,
  };
}

export async function submitSignedEscrowTx({ signed_transaction_base64, agent_wallet }) {
  const user = requireAgentWallet(agent_wallet);
  const raw = typeof signed_transaction_base64 === "string" ? signed_transaction_base64.trim() : "";
  if (!raw) {
    throw new Error("signed_transaction_base64_required: base64 signed Solana transaction.");
  }

  let bytes;
  try {
    bytes = Buffer.from(raw, "base64");
  } catch {
    throw new Error("signed_transaction_base64_invalid");
  }

  if (isSubmitWhitelistEnabled()) {
    assertEscrowSubmitAllowed(bytes, getEscrowProgramId());
  }

  const connection = await getEscrowConnection();
  const tx = Transaction.from(bytes);
  if (!tx.feePayer?.equals(user)) {
    throw new Error(
      "fee_payer_mismatch: signed tx fee payer must match agent_wallet (agent signs locally).",
    );
  }

  let sig;
  try {
    sig = await connection.sendRawTransaction(bytes, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
  } catch (err) {
    invalidateEscrowRpcCache();
    const retryConn = await getEscrowConnection();
    sig = await retryConn.sendRawTransaction(bytes, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await retryConn.confirmTransaction(sig, "confirmed");
    return {
      ok: true,
      action: "broadcast",
      tx_signature: sig,
      fee_payer: user.toBase58(),
      explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      cluster: "devnet",
      rpc_retried: true,
    };
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  return {
    ok: true,
    action: "broadcast",
    tx_signature: sig,
    fee_payer: user.toBase58(),
    explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    cluster: "devnet",
  };
}

/** F96N P1 — keeper signs and broadcasts permissionless settle (fee payer only). */
export async function broadcastSettleTx({ fixture_id, outcome, signerKeypair, cpi_args }) {
  if (!signerKeypair?.publicKey) {
    throw new Error("keeper_keypair_required");
  }
  const wallet = signerKeypair.publicKey.toBase58();
  let args = cpi_args;
  if (!args) {
    const fetched = await fetchCpiSettleArgs(fixture_id, outcome);
    args = fetched?.cpi_args ?? fetched;
  }
  const built = await buildSettleTx({
    fixture_id,
    outcome,
    agent_wallet: wallet,
    cpi_args: args,
  });
  const tx = Transaction.from(Buffer.from(built.transaction_base64, "base64"));
  tx.sign(signerKeypair);
  return submitSignedEscrowTx({
    signed_transaction_base64: tx.serialize().toString("base64"),
    agent_wallet: wallet,
  });
}

async function buildRefundStyleTx({ fixture_id, agent_wallet, method }) {
  const user = requireAgentWallet(agent_wallet);
  const programId = getEscrowProgramId();
  const connection = await getEscrowConnection();
  const program = escrowProgram(connection, user, programId);
  const pool = poolPda(programId, fixture_id);
  const vault = vaultPda(programId, fixture_id);
  const position = positionPda(programId, pool, user);
  const usdcMint = new PublicKey(USDC_DEVNET_MINT);
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user);

  const tx = new Transaction();
  tx.add(createAssociatedTokenAccountIdempotentInstruction(user, userUsdc, user, usdcMint));
  const refundIx = await program.methods[method]()
    .accounts({
      claimer: user,
      pool,
      vault,
      position,
      claimerTokenAccount: userUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  tx.add(refundIx);

  const body = await serializeUnsignedTx(connection, tx, user);
  return {
    ok: true,
    fixture_id,
    action: method,
    ...body,
  };
}

export async function buildRefundTx({ fixture_id, agent_wallet }) {
  return buildRefundStyleTx({ fixture_id, agent_wallet, method: "refund" });
}

export async function buildRefundAllTx({ fixture_id, agent_wallet }) {
  return buildRefundStyleTx({ fixture_id, agent_wallet, method: "refundAll" });
}

export async function buildClaimTx({ fixture_id, agent_wallet }) {
  const user = requireAgentWallet(agent_wallet);
  const programId = getEscrowProgramId();
  const connection = await getEscrowConnection();
  const program = escrowProgram(connection, user, programId);
  const pool = poolPda(programId, fixture_id);
  const vault = vaultPda(programId, fixture_id);
  const position = positionPda(programId, pool, user);
  const usdcMint = new PublicKey(USDC_DEVNET_MINT);
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user);

  const tx = new Transaction();
  tx.add(createAssociatedTokenAccountIdempotentInstruction(user, userUsdc, user, usdcMint));
  const claimIx = await program.methods
    .claim()
    .accounts({
      claimer: user,
      pool,
      vault,
      position,
      claimerTokenAccount: userUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  tx.add(claimIx);

  const body = await serializeUnsignedTx(connection, tx, user);
  return {
    ok: true,
    fixture_id,
    action: "claim",
    ...body,
  };
}
