/**
 * T4 smoke — simulate TxLINE validate_stat via Anchor .view() before on-chain settle CPI.
 *
 * Usage:
 *   TXLINE_GATEWAY=http://localhost:4001 npx tsx scripts/smoke_view_validate.ts --fixture 18172280 --outcome home
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { ComputeBudgetProgram, Connection, PublicKey } from "@solana/web3.js";

const TXLINE_PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!;
  return fallback;
}

type CpiArgs = {
  targetTs: string;
  fixtureSummary: {
    fixtureId: string;
    updateStats: { updateCount: number; minTimestamp: string; maxTimestamp: string };
    eventsSubTreeRoot: number[];
  };
  fixtureProof: Array<{ hash: number[]; isRightSibling: boolean }>;
  mainTreeProof: Array<{ hash: number[]; isRightSibling: boolean }>;
  predicate: { threshold: number; comparison: Record<string, unknown> };
  stat1: {
    statToProve: { key: number; value: number; period: number };
    eventStatRoot: number[];
    statProof: Array<{ hash: number[]; isRightSibling: boolean }>;
  };
  stat2: {
    statToProve: { key: number; value: number; period: number };
    eventStatRoot: number[];
    statProof: Array<{ hash: number[]; isRightSibling: boolean }>;
  };
  op: { subtract: Record<string, never> };
  dailyScoresPdaSeeds: { epochDay: number; seeds: [string, number[]] };
};

function toBytes32(arr: number[]): Buffer {
  if (arr.length !== 32) throw new Error(`expected 32 bytes, got ${arr.length}`);
  return Buffer.from(arr);
}

function toProofNodes(nodes: CpiArgs["fixtureProof"]) {
  return nodes.map((n) => ({
    hash: Array.from(toBytes32(n.hash)),
    isRightSibling: n.isRightSibling,
  }));
}

async function main(): Promise<void> {
  const fixtureId = arg("--fixture", "18172280");
  const outcome = arg("--outcome", "home");
  const gateway = process.env.TXLINE_GATEWAY?.replace(/\/$/, "") ?? "http://localhost:4001";

  const res = await fetch(`${gateway}/v1/fixtures/${fixtureId}/cpi-args?outcome=${outcome}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`cpi-args ${res.status}: ${body}`);
  }
  const args = (await res.json()) as CpiArgs;

  const idlPath = resolve(
    __dirname,
    "../../natt-pundit/apps/web/public/txline-idl.json",
  );
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));
  const connection = new Connection(
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    "confirmed",
  );
  const provider = new anchor.AnchorProvider(connection, {} as anchor.Wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl, provider);

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
  const stat2 = {
    statToProve: args.stat2.statToProve,
    eventStatRoot: Array.from(toBytes32(args.stat2.eventStatRoot)),
    statProof: toProofNodes(args.stat2.statProof),
  };

  const dayLe = Buffer.from(args.dailyScoresPdaSeeds.seeds[1]);
  const [dailyScoresPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("daily_scores_roots"), dayLe],
    TXLINE_PROGRAM_ID,
  );

  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });

  const isValid = await program.methods
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
    .preInstructions([computeBudgetIx])
    .view();

  console.log(JSON.stringify({ fixtureId, outcome, dailyScoresPda: dailyScoresPda.toBase58(), isValid }, null, 2));
  if (!isValid) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
