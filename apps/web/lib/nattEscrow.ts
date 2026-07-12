import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
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
import type { CpiSettleArgs, EscrowCpiResponse, EscrowOutcome } from "@natt-pundit/contracts";
import type { ConnectedWallet } from "./solanaWallet";
import { getSolanaRpcUrl } from "./solanaRpc";
import { escrowCluster, explorerClusterQuery, txlineProgramId, usdcMintAddress } from "./escrowCluster";
import { loadPhantomMobileSession, setPhantomEscrowSignMeta } from "./phantomMobileDeeplink";
import nattEscrowIdl from "@/idl/natt_escrow.json";
import txlineIdl from "@/idl/txline.json";
import { parsePoolAccountBytes, poolSnapshotFromJson, type PoolSnapshotParsed } from "./poolSnapshotParse";

export function usdcMintForEscrow(): PublicKey {
  return new PublicKey(usdcMintAddress());
}

export const MIN_DEPOSIT_USDC = 0.01;
export const MIN_DEPOSIT_BASE = BigInt(10000);
const MIN_DEVNET_SOL_LAMPORTS = 5_000_000; // ~0.005 SOL for rent + fees

function escrowRpcUrl(): string {
  if (escrowCluster() === "devnet") {
    if (typeof window !== "undefined") {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";
      return `${window.location.origin}${basePath}/api/solana/rpc?cluster=devnet`;
    }
    return "https://api.devnet.solana.com";
  }
  return getSolanaRpcUrl();
}

export function escrowConnection(): Connection {
  return new Connection(escrowRpcUrl(), "confirmed");
}

function formatEscrowTxError(err: unknown, logs?: string[] | null): string {
  const raw = err instanceof Error ? err.message : String(err);
  const blob = `${raw} ${(logs ?? []).join(" ")}`.toLowerCase();
  if (
    blob.includes("attempt to debit an account but found no record of a prior credit") ||
    blob.includes("accountnotfound")
  ) {
    return "devnet_sol_required: pas de SOL devnet sur ce wallet (airdrop faucet.solana.com ou Phantom devnet).";
  }
  if (blob.includes("insufficient funds") || blob.includes("insufficient lamports")) {
    return "devnet_sol_low: SOL devnet insuffisant pour les frais / rent.";
  }
  if (blob.includes("notwinner") || blob.includes("not on winning side") || blob.includes("6008")) {
    return "not_winner: tu n es pas sur le cote gagnant — pas de claim (mise perdue).";
  }
  if (logs?.length) return `${raw} | logs: ${logs.slice(-4).join("; ")}`;
  return raw;
}

async function assertDevnetSol(connection: Connection, owner: PublicKey): Promise<void> {
  if (escrowCluster() !== "devnet") return;
  const lamports = await connection.getBalance(owner);
  if (lamports < MIN_DEVNET_SOL_LAMPORTS) {
    throw new Error(
      `devnet_sol_required: ${(lamports / 1e9).toFixed(4)} SOL — minimum ~0.005 SOL devnet (faucet.solana.com).`,
    );
  }
}

async function assertDevnetUsdc(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
  amountBase: bigint,
): Promise<void> {
  if (escrowCluster() !== "devnet") return;
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const info = await connection.getAccountInfo(ata);
  if (!info) {
    throw new Error("devnet_usdc_required: compte USDC devnet absent — faucet.circle.com puis retry.");
  }
  const bal = await connection.getTokenAccountBalance(ata);
  const have = BigInt(bal.value.amount);
  if (have < amountBase) {
    throw new Error(
      `devnet_usdc_low: ${bal.value.uiAmountString ?? "0"} USDC — minimum ${MIN_DEPOSIT_USDC} USDC devnet.`,
    );
  }
}

async function sendEscrowTransaction(
  wallet: ConnectedWallet,
  tx: Transaction,
  meta?: { fixtureId: string; action: string },
): Promise<string> {
  const connection = escrowConnection();
  const user = new PublicKey(wallet.address);
  await assertDevnetSol(connection, user);

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = user;

  if (meta) setPhantomEscrowSignMeta(meta);

  const phantomMobile = Boolean(loadPhantomMobileSession());

  if (!phantomMobile) {
    try {
      const sim = await connection.simulateTransaction(tx);
      if (sim.value.err) {
        throw new Error(formatEscrowTxError(JSON.stringify(sim.value.err), sim.value.logs));
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.startsWith("devnet_")) throw e;
      throw new Error(formatEscrowTxError(e, null));
    }
  }

  try {
    return await wallet.signAndSendTransaction(tx, connection);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "phantom_mobile_redirect") {
      throw e;
    }
    throw new Error(formatEscrowTxError(e, null));
  }
}

export function escrowUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NATT_ESCROW_ENABLED === "true";
}

let cachedEscrowProgramId: PublicKey | null | undefined;

export function getEscrowProgramId(): PublicKey | null {
  if (cachedEscrowProgramId !== undefined) return cachedEscrowProgramId;
  const raw = process.env.NEXT_PUBLIC_NATT_ESCROW_PROGRAM_ID?.trim();
  if (!raw) {
    cachedEscrowProgramId = null;
    return null;
  }
  try {
    cachedEscrowProgramId = new PublicKey(raw);
    return cachedEscrowProgramId;
  } catch {
    cachedEscrowProgramId = null;
    return null;
  }
}

function fixtureIdLeBytes(fixtureId: string): Buffer {
  const n = BigInt(fixtureId);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(n);
  return buf;
}

export function poolPda(programId: PublicKey, fixtureId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), fixtureIdLeBytes(fixtureId)],
    programId,
  );
  return pda;
}

export function vaultPda(programId: PublicKey, fixtureId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), fixtureIdLeBytes(fixtureId)],
    programId,
  );
  return pda;
}

export function positionPda(programId: PublicKey, pool: PublicKey, owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), pool.toBuffer(), owner.toBuffer()],
    programId,
  );
  return pda;
}

function anchorProvider(connection: Connection, wallet: ConnectedWallet): anchor.AnchorProvider {
  const user = new PublicKey(wallet.address);
  const dummyWallet = {
    publicKey: user,
    signTransaction: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
      t: T,
    ) => t,
    signAllTransactions: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
      ts: T[],
    ) => ts,
  } as anchor.Wallet;
  return new anchor.AnchorProvider(connection, dummyWallet, { commitment: "confirmed" });
}

function escrowProgram(connection: Connection, wallet: ConnectedWallet, programId: PublicKey) {
  const provider = anchorProvider(connection, wallet);
  return new Program({ ...nattEscrowIdl, address: programId.toBase58() } as anchor.Idl, provider);
}

function txlineProgramClient(connection: Connection, wallet: ConnectedWallet, programPk: PublicKey) {
  const provider = anchorProvider(connection, wallet);
  const idl = { ...txlineIdl, address: programPk.toBase58() } as anchor.Idl;
  return new Program(idl, provider);
}

function toBytes32(arr: number[]): Buffer {
  if (arr.length !== 32) throw new Error(`expected 32 bytes, got ${arr.length}`);
  return Buffer.from(arr);
}

function toProofNodes(nodes: CpiSettleArgs["fixtureProof"]) {
  return nodes.map((n) => ({
    hash: Array.from(toBytes32(n.hash)),
    isRightSibling: n.isRightSibling,
  }));
}

export type PoolSnapshot = {
  exists: boolean;
  settled: boolean;
  winningSide: number;
  totalDeposited: bigint;
  sideTotals: [bigint, bigint, bigint];
  kickoffTs: number;
};

export const EMPTY_POOL_SNAPSHOT: PoolSnapshot = {
  exists: false,
  settled: false,
  winningSide: 255,
  totalDeposited: BigInt(0),
  sideTotals: [BigInt(0), BigInt(0), BigInt(0)],
  kickoffTs: 0,
};

export type UserPositionView = {
  exists: boolean;
  side: EscrowOutcome | null;
  amountUsdc: number;
  claimed: boolean;
};

export type EscrowActivityView = {
  pool: PoolSnapshot;
  participantCount: number;
  yourPosition: UserPositionView | null;
};

export async function fetchWalletUsdcBalance(walletAddress: string): Promise<number | null> {
  try {
    const connection = escrowConnection();
    const owner = new PublicKey(walletAddress);
    const mint = usdcMintForEscrow();
    const ata = getAssociatedTokenAddressSync(mint, owner);
    const bal = await connection.getTokenAccountBalance(ata);
    return Number(bal.value.uiAmountString ?? 0);
  } catch {
    return null;
  }
}

function mapActivityJson(j: {
  pool: {
    exists: boolean;
    settled: boolean;
    winningSide: number;
    totalDeposited: string;
    sideTotals: [string, string, string];
    kickoffTs: number;
  };
  participantCount: number;
  yourPosition?: {
    exists: boolean;
    side: string | null;
    amountUsdc: number;
    claimed: boolean;
  };
}): EscrowActivityView {
  const pool = poolSnapshotFromJson(j.pool);
  let yourPosition: UserPositionView | null = null;
  if (j.yourPosition) {
    const side =
      j.yourPosition.side === "home" || j.yourPosition.side === "draw" || j.yourPosition.side === "away"
        ? j.yourPosition.side
        : null;
    yourPosition = {
      exists: j.yourPosition.exists,
      side,
      amountUsdc: j.yourPosition.amountUsdc,
      claimed: j.yourPosition.claimed,
    };
  }
  return { pool, participantCount: j.participantCount, yourPosition };
}

export async function fetchEscrowActivity(
  fixtureId: string,
  walletAddress?: string | null,
): Promise<EscrowActivityView | null> {
  const pid = getEscrowProgramId();
  if (!pid) return null;

  if (typeof window !== "undefined") {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";
      const qs = walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : "";
      const res = await fetch(
        `${window.location.origin}${basePath}/api/escrow/activity/${fixtureId}${qs}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        return mapActivityJson(await res.json());
      }
    } catch {
      /* fallback below */
    }
  }

  const pool = await fetchPoolSnapshot(fixtureId, pid);
  if (!pool) return null;
  return { pool, participantCount: pool.totalDeposited > BigInt(0) ? 1 : 0, yourPosition: null };
}

async function fetchVaultUsdcBase(
  connection: Connection,
  programId: PublicKey,
  fixtureId: string,
): Promise<bigint | null> {
  try {
    const vault = vaultPda(programId, fixtureId);
    const vb = await connection.getTokenAccountBalance(vault);
    return BigInt(vb.value.amount);
  } catch {
    return null;
  }
}

async function enrichPoolWithVaultBalance(
  connection: Connection,
  programId: PublicKey,
  fixtureId: string,
  snapshot: PoolSnapshotParsed,
): Promise<PoolSnapshot> {
  const vaultBase = await fetchVaultUsdcBase(connection, programId, fixtureId);
  if (vaultBase !== null) {
    return { ...snapshot, totalDeposited: vaultBase };
  }
  return snapshot;
}

export async function fetchPoolSnapshot(
  fixtureId: string,
  programId?: PublicKey | null,
): Promise<PoolSnapshot | null> {
  const pid = programId ?? getEscrowProgramId();
  if (!pid) return null;

  if (typeof window !== "undefined") {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";
      const res = await fetch(`${window.location.origin}${basePath}/api/escrow/pool/${fixtureId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        return poolSnapshotFromJson(await res.json());
      }
    } catch {
      /* fallback client RPC */
    }
  }

  const connection = escrowConnection();
  const poolKey = poolPda(pid, fixtureId);
  const info = await connection.getAccountInfo(poolKey);
  if (!info?.data) {
    return { ...EMPTY_POOL_SNAPSHOT };
  }

  const parsed = parsePoolAccountBytes(info.data);
  return enrichPoolWithVaultBalance(connection, pid, fixtureId, parsed);
}

export async function createPool(
  wallet: ConnectedWallet,
  fixtureId: string,
  kickoffAtIso: string,
): Promise<string> {
  const programId = getEscrowProgramId();
  if (!programId) throw new Error("escrow_program_not_configured");

  const kickoffTs = Math.floor(Date.parse(kickoffAtIso) / 1000);
  if (!Number.isFinite(kickoffTs)) throw new Error("invalid_kickoff");

  const connection = new Connection(escrowRpcUrl(), "confirmed");
  const user = new PublicKey(wallet.address);
  const program = escrowProgram(connection, wallet, programId);
  const pool = poolPda(programId, fixtureId);
  const vault = vaultPda(programId, fixtureId);
  const usdcMint = usdcMintForEscrow();

  const createIx = await program.methods
    .createPool(new BN(BigInt(fixtureId).toString()), new BN(kickoffTs))
    .accounts({
      authority: user,
      usdcMint,
      pool,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  return sendEscrowTransaction(wallet, new Transaction().add(createIx), {
    fixtureId,
    action: "create_pool",
  });
}

export async function depositUsdc(
  wallet: ConnectedWallet,
  fixtureId: string,
  side: 0 | 1 | 2,
  amountUsdc: number,
): Promise<string> {
  const programId = getEscrowProgramId();
  if (!programId) throw new Error("escrow_program_not_configured");

  const amountBase = BigInt(Math.round(amountUsdc * 1_000_000));
  if (amountBase < MIN_DEPOSIT_BASE) {
    throw new Error(`min_deposit_${MIN_DEPOSIT_USDC}_usdc`);
  }

  const connection = escrowConnection();
  const user = new PublicKey(wallet.address);
  const program = escrowProgram(connection, wallet, programId);
  const pool = poolPda(programId, fixtureId);
  const vault = vaultPda(programId, fixtureId);
  const position = positionPda(programId, pool, user);
  const usdcMint = usdcMintForEscrow();
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user);

  const positionInfo = await connection.getAccountInfo(position);
  const usdcAtaInfo = await connection.getAccountInfo(userUsdc);
  if (usdcAtaInfo) {
    await assertDevnetUsdc(connection, user, usdcMint, amountBase);
  }

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(user, userUsdc, user, usdcMint),
  );

  if (positionInfo) {
    const pos = program.coder.accounts.decode("UserPosition", positionInfo.data) as {
      side: number;
    };
    if (Number(pos.side) !== side) {
      throw new Error("side_mismatch_existing_position");
    }
  } else {
    const openIx = await program.methods
      .openPosition(side)
      .accounts({
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
    .accounts({
      depositor: user,
      pool,
      vault,
      position,
      depositorTokenAccount: userUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  tx.add(depositIx);

  return sendEscrowTransaction(wallet, tx, { fixtureId, action: "deposit" });
}

async function buildTxlineValidateStatIxData(
  wallet: ConnectedWallet,
  args: CpiSettleArgs,
  txlineProgramPk: PublicKey,
): Promise<Buffer> {
  const connection = new Connection(escrowRpcUrl(), "confirmed");
  const txline = txlineProgramClient(connection, wallet, txlineProgramPk);

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

  const ix = await txline.methods
    .validateStat(
      new BN(args.targetTs),
      fixtureSummary,
      toProofNodes(args.fixtureProof),
      toProofNodes(args.mainTreeProof),
      args.predicate,
      stat1,
      stat2,
      args.op,
    )
    .accounts({ dailyScoresMerkleRoots: dailyScoresPda })
    .instruction();

  return Buffer.from(ix.data);
}

export async function settlePool(
  wallet: ConnectedWallet,
  fixtureId: string,
  cpiArgs: EscrowCpiResponse,
): Promise<string> {
  const programId = getEscrowProgramId();
  if (!programId) throw new Error("escrow_program_not_configured");

  const txlinePk = new PublicKey(cpiArgs.txlineProgramId);
  const connection = new Connection(escrowRpcUrl(), "confirmed");
  const program = escrowProgram(connection, wallet, programId);
  const pool = poolPda(programId, fixtureId);

  // F95N security: only CPI-proven settles (standard mode). The former knockout_tab mode
  // (client-asserted pen winner) was removed — shootout winners are proven via pen-goal stats.
  const txlineIxData = await buildTxlineValidateStatIxData(wallet, cpiArgs, txlinePk);

  const dayLe = Buffer.from(cpiArgs.dailyScoresPdaSeeds.seeds[1]);
  const [dailyScoresPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("daily_scores_roots"), dayLe],
    txlinePk,
  );

  const settleIx = await program.methods
    .settle(txlineIxData)
    .accounts({
      pool,
      dailyScoresMerkleRoots: dailyScoresPda,
      txlineProgram: txlinePk,
    })
    .instruction();

  const tx = new Transaction()
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }))
    .add(settleIx);
  return sendEscrowTransaction(wallet, tx, { fixtureId, action: "settle" });
}

export async function claimWinnings(wallet: ConnectedWallet, fixtureId: string): Promise<string> {
  const programId = getEscrowProgramId();
  if (!programId) throw new Error("escrow_program_not_configured");

  const connection = new Connection(escrowRpcUrl(), "confirmed");
  const user = new PublicKey(wallet.address);
  const program = escrowProgram(connection, wallet, programId);
  const pool = poolPda(programId, fixtureId);
  const vault = vaultPda(programId, fixtureId);
  const position = positionPda(programId, pool, user);
  const usdcMint = usdcMintForEscrow();
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user);

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

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(user, userUsdc, user, usdcMint),
  );
  tx.add(claimIx);

  return sendEscrowTransaction(wallet, tx, { fixtureId, action: "claim" });
}

async function buildRefundTx(
  wallet: ConnectedWallet,
  fixtureId: string,
  method: "refund" | "refundAll",
): Promise<string> {
  const programId = getEscrowProgramId();
  if (!programId) throw new Error("escrow_program_not_configured");

  const connection = new Connection(escrowRpcUrl(), "confirmed");
  const user = new PublicKey(wallet.address);
  const program = escrowProgram(connection, wallet, programId);
  const pool = poolPda(programId, fixtureId);
  const vault = vaultPda(programId, fixtureId);
  const position = positionPda(programId, pool, user);
  const usdcMint = usdcMintForEscrow();
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user);

  const refundIx = await program.methods[method === "refund" ? "refund" : "refundAll"]()
    .accounts({
      claimer: user,
      pool,
      vault,
      position,
      claimerTokenAccount: userUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(user, userUsdc, user, usdcMint),
  );
  tx.add(refundIx);
  return sendEscrowTransaction(wallet, tx, {
    fixtureId,
    action: method === "refund" ? "refund" : "refund_all",
  });
}

export async function refundUnmatched(wallet: ConnectedWallet, fixtureId: string): Promise<string> {
  return buildRefundTx(wallet, fixtureId, "refund");
}

export async function refundAllVoid(wallet: ConnectedWallet, fixtureId: string): Promise<string> {
  return buildRefundTx(wallet, fixtureId, "refundAll");
}

export function outcomeFromScore(home: number, away: number): EscrowOutcome {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export function explorerTxUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}${explorerClusterQuery()}`;
}

export function defaultTxlineProgramPk(): PublicKey {
  return new PublicKey(txlineProgramId());
}
