import type { SettlementProof } from "@natt-pundit/contracts";
import { SettlementProofSchema } from "@natt-pundit/contracts";
import {
  TXLINE_PROGRAM_ID,
  TXLINE_STAT_HOME_GOALS,
  hashToBytes,
  verifyTxlineSettlementProof,
  type MerkleProofNode,
} from "@natt-pundit/natt-core";
import { txlineGet } from "./txlineClient.js";
import type { TxlineScoreRow } from "./txlineMap.js";

type ProofNode = { hash: string | number[] | Uint8Array; isRightSibling: boolean };

type TxlineStatValidation = {
  summary?: {
    fixtureId: number;
    updateStats?: { updateCount: number; minTimestamp: number; maxTimestamp: number };
    eventStatsSubTreeRoot?: string | number[] | Uint8Array;
  };
  subTreeProof?: ProofNode[];
  mainTreeProof?: ProofNode[];
  statToProve?: { key: number; value: number; period: number };
  eventStatRoot?: string | number[] | Uint8Array;
  statProof?: ProofNode[];
};

function hashToHex(hash: string | number[] | Uint8Array | undefined | null): string {
  if (hash === null || hash === undefined) return "0x0";
  const bytes = hashToBytes(hash);
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

function proofPath(nodes: ProofNode[] | undefined): string[] {
  if (!nodes?.length) return [];
  return nodes.map((n) => hashToHex(n.hash));
}

function mapProofNodes(nodes: ProofNode[] | undefined): MerkleProofNode[] {
  if (!nodes?.length) return [];
  return nodes.map((n) => ({
    hash: hashToBytes(n.hash),
    isRightSibling: Boolean(n.isRightSibling),
  }));
}

function statValueFromPayload(stat: unknown): string {
  if (stat === null || stat === undefined) return "unknown";
  if (typeof stat === "string" || typeof stat === "number" || typeof stat === "boolean") {
    return String(stat);
  }
  if (typeof stat === "object") {
    const obj = stat as Record<string, unknown>;
    for (const key of ["value", "statValue", "goals", "score"]) {
      if (obj[key] !== undefined) return String(obj[key]);
    }
    return JSON.stringify(stat).slice(0, 120);
  }
  return String(stat);
}

type TxlineScoreUpdate = {
  Seq?: number;
  seq?: number;
  FixtureId?: number;
};

async function resolveSeq(fixtureId: string): Promise<number | null> {
  try {
    const updates = await txlineGet<TxlineScoreUpdate[]>(`/api/scores/updates/${fixtureId}`);
    let maxSeq: number | null = null;
    for (const row of updates) {
      const candidate = row.Seq ?? row.seq;
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        const seq = Math.trunc(candidate);
        if (maxSeq === null || seq > maxSeq) maxSeq = seq;
      }
    }
    if (maxSeq !== null) return maxSeq;
  } catch {
    /* try snapshot */
  }

  const scoreRows = await txlineGet<TxlineScoreRow[]>(`/api/scores/snapshot/${fixtureId}`);
  return extractSeq(scoreRows);
}

function extractSeq(rows: TxlineScoreRow[]): number | null {
  const sorted = [...rows].sort((a, b) => b.Ts - a.Ts);
  for (const row of sorted) {
    const data = row.Data ?? {};
    const candidates = [
      data.seq,
      data.Seq,
      data.sequence,
      data.updateSeq,
      (row as { Seq?: number }).Seq,
    ];
    for (const c of candidates) {
      if (typeof c === "number" && Number.isFinite(c) && c >= 0) {
        return Math.trunc(c);
      }
    }
  }
  return null;
}

function mockProof(fixtureId: string): SettlementProof {
  const ts = new Date().toISOString();
  return SettlementProofSchema.parse({
    fixtureId,
    merkleRoot: `0xmock_root_${fixtureId.slice(0, 8)}`,
    leafHash: `0xmock_leaf_${fixtureId.slice(0, 8)}`,
    proof: ["0xmock_proof_a", "0xmock_proof_b"],
    statType: "final_score",
    statValue: "mock_pending",
    validated: false,
    source: "mock",
    chain: "solana",
    programId: TXLINE_PROGRAM_ID,
    ts,
  });
}

function resolveMerkleRoot(validation: TxlineStatValidation): Uint8Array {
  const mainNodes = validation.mainTreeProof ?? [];
  const terminal = mainNodes[mainNodes.length - 1];
  if (terminal) return hashToBytes(terminal.hash);
  if (validation.summary?.eventStatsSubTreeRoot) {
    return hashToBytes(validation.summary.eventStatsSubTreeRoot);
  }
  return hashToBytes(validation.eventStatRoot);
}

function runMerkleVerify(validation: TxlineStatValidation): { valid: boolean; reason: string } {
  const summaryRoot = validation.summary?.eventStatsSubTreeRoot;
  const eventStatRoot = validation.eventStatRoot;
  const statToProve = validation.statToProve;

  if (!summaryRoot || !eventStatRoot || !statToProve) {
    return { valid: false, reason: "incomplete_validation_payload" };
  }

  return verifyTxlineSettlementProof({
    statToProve,
    eventStatRoot: hashToBytes(eventStatRoot),
    statProof: mapProofNodes(validation.statProof),
    subTreeProof: mapProofNodes(validation.subTreeProof),
    mainTreeProof: mapProofNodes(validation.mainTreeProof),
    summarySubTreeRoot: hashToBytes(summaryRoot),
    merkleRoot: resolveMerkleRoot(validation),
  });
}

function mapValidationToProof(
  fixtureId: string,
  validation: TxlineStatValidation,
  seq: number,
  statKey: number,
): SettlementProof {
  const ts = new Date().toISOString();
  const merkleRootBytes = resolveMerkleRoot(validation);
  const leaf = validation.eventStatRoot ?? validation.statProof?.[0]?.hash ?? "0x0";
  const path = [
    ...proofPath(validation.statProof),
    ...proofPath(validation.subTreeProof),
    ...proofPath(validation.mainTreeProof),
  ];
  const verify = runMerkleVerify(validation);

  return SettlementProofSchema.parse({
    fixtureId,
    merkleRoot: hashToHex(merkleRootBytes),
    leafHash: hashToHex(leaf),
    proof: path.length ? path : ["0x0"],
    statType: `stat_${statKey}`,
    statValue: statValueFromPayload(validation.statToProve),
    validated: verify.valid,
    source: "txline",
    chain: "solana",
    programId: TXLINE_PROGRAM_ID,
    seq,
    statKey,
    ts,
  });
}

export async function getFixtureProof(fixtureId: string): Promise<SettlementProof> {
  if (process.env.TXODDS_MOCK === "true") {
    return mockProof(fixtureId);
  }
  if (!process.env.TXLINE_API_TOKEN?.trim()) {
    return mockProof(fixtureId);
  }

  const fid = Number.parseInt(fixtureId, 10);
  if (!Number.isFinite(fid)) {
    throw new Error("invalid_fixture_id");
  }

  const seq = await resolveSeq(fixtureId);
  if (seq === null) {
    throw new Error("no_score_seq");
  }

  const query = new URLSearchParams({
    fixtureId: String(fid),
    seq: String(seq),
    statKey: String(TXLINE_STAT_HOME_GOALS),
  });
  const validation = await txlineGet<TxlineStatValidation>(
    `/api/scores/stat-validation?${query.toString()}`,
  );

  return mapValidationToProof(fixtureId, validation, seq, TXLINE_STAT_HOME_GOALS);
}

export async function verifyFixtureProof(fixtureId: string): Promise<{
  valid: boolean;
  reason: string;
  proof?: SettlementProof;
}> {
  if (process.env.TXODDS_MOCK === "true" || !process.env.TXLINE_API_TOKEN?.trim()) {
    return { valid: false, reason: "mock_or_no_token" };
  }

  try {
    const proof = await getFixtureProof(fixtureId);
    return {
      valid: proof.validated,
      reason: proof.validated ? "ok" : "verify_failed",
      proof,
    };
  } catch (err) {
    return {
      valid: false,
      reason: err instanceof Error ? err.message : "verify_error",
    };
  }
}

export { mockProof, runMerkleVerify };
