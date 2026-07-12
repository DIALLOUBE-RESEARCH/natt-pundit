import {
  TXLINE_PROGRAM_ID,
  type TxlineHomeAwayStatKeys,
  txlineHomeAwayStatKeys,
} from "./config.js";
import { hashToBytes } from "./merkle_verify.js";

export type EscrowOutcome = "home" | "draw" | "away";

export type TxlineProofNodeWire = {
  hash: string | number[] | Uint8Array;
  isRightSibling: boolean;
};

export type TxlineStatValidationPayload = {
  summary?: {
    fixtureId: number;
    updateStats?: {
      updateCount: number;
      minTimestamp: number;
      maxTimestamp: number;
    };
    eventStatsSubTreeRoot?: string | number[] | Uint8Array;
  };
  subTreeProof?: TxlineProofNodeWire[];
  mainTreeProof?: TxlineProofNodeWire[];
  statToProve?: { key: number; value: number; period: number };
  statToProve2?: { key: number; value: number; period: number };
  eventStatRoot?: string | number[] | Uint8Array;
  statProof?: TxlineProofNodeWire[];
  statProof2?: TxlineProofNodeWire[];
};

export type AnchorProofNode = {
  hash: number[];
  isRightSibling: boolean;
};

export type AnchorFixtureSummary = {
  fixtureId: string;
  updateStats: {
    updateCount: number;
    minTimestamp: string;
    maxTimestamp: string;
  };
  eventsSubTreeRoot: number[];
};

export type AnchorStatTerm = {
  statToProve: { key: number; value: number; period: number };
  eventStatRoot: number[];
  statProof: AnchorProofNode[];
};

export type AnchorPredicate = {
  threshold: number;
  comparison: { greaterThan: Record<string, never> } | { lessThan: Record<string, never> } | { equalTo: Record<string, never> };
};

export type AnchorBinaryOp = { subtract: Record<string, never> };

export type ValidateStatArgs = {
  programId: string;
  targetTs: string;
  fixtureSummary: AnchorFixtureSummary;
  fixtureProof: AnchorProofNode[];
  mainTreeProof: AnchorProofNode[];
  predicate: AnchorPredicate;
  stat1: AnchorStatTerm;
  stat2: AnchorStatTerm | null;
  op: AnchorBinaryOp | null;
  outcome: EscrowOutcome;
  dailyScoresPdaSeeds: {
    epochDay: number;
    seeds: [string, number[]];
  };
};

/** 32-byte hash as number[] for Anchor client (TxLINE on-chain validation guide). */
export function toBytes32(value: string | number[] | Uint8Array): number[] {
  const bytes = hashToBytes(value);
  if (bytes.length !== 32) {
    throw new Error(`Expected 32 bytes, received ${bytes.length}`);
  }
  return Array.from(bytes);
}

export function toProofNodes(nodes: TxlineProofNodeWire[] | undefined): AnchorProofNode[] {
  if (!nodes?.length) return [];
  return nodes.map((node) => ({
    hash: toBytes32(node.hash),
    isRightSibling: Boolean(node.isRightSibling),
  }));
}

export function epochDayFromMinTimestamp(minTimestampMs: number): number {
  if (!Number.isFinite(minTimestampMs) || minTimestampMs < 0) {
    throw new Error("invalid_min_timestamp");
  }
  return Math.floor(minTimestampMs / 86_400_000);
}

/** Seeds for `PublicKey.findProgramAddressSync` — client derives the PDA address. */
export function dailyScoresPdaSeeds(
  minTimestampMs: number,
): { epochDay: number; seeds: [string, number[]] } {
  const epochDay = epochDayFromMinTimestamp(minTimestampMs);
  const dayLe = [epochDay & 0xff, (epochDay >> 8) & 0xff];
  return {
    epochDay,
    seeds: ["daily_scores_roots", dayLe],
  };
}

export function predicateForOutcome(outcome: EscrowOutcome): AnchorPredicate {
  switch (outcome) {
    case "home":
      return { threshold: 0, comparison: { greaterThan: {} } };
    case "draw":
      return { threshold: 0, comparison: { equalTo: {} } };
    case "away":
      return { threshold: 0, comparison: { lessThan: {} } };
    default: {
      const _exhaustive: never = outcome;
      throw new Error(`unknown_outcome:${String(_exhaustive)}`);
    }
  }
}

export function binaryOpFor1x2(): AnchorBinaryOp {
  return { subtract: {} };
}

function requireSummary(payload: TxlineStatValidationPayload): NonNullable<TxlineStatValidationPayload["summary"]> {
  const summary = payload.summary;
  if (!summary?.updateStats || summary.fixtureId === undefined) {
    throw new Error("incomplete_validation_summary");
  }
  if (!summary.eventStatsSubTreeRoot) {
    throw new Error("missing_event_stats_subtree_root");
  }
  return summary;
}

export function buildFixtureSummary(payload: TxlineStatValidationPayload): AnchorFixtureSummary {
  const summary = requireSummary(payload);
  const stats = summary.updateStats!;
  return {
    fixtureId: String(summary.fixtureId),
    updateStats: {
      updateCount: stats.updateCount,
      minTimestamp: String(stats.minTimestamp),
      maxTimestamp: String(stats.maxTimestamp),
    },
    eventsSubTreeRoot: toBytes32(summary.eventStatsSubTreeRoot!),
  };
}

function buildStatTerm(
  statToProve: { key: number; value: number; period: number } | undefined,
  eventStatRoot: string | number[] | Uint8Array | undefined,
  statProof: TxlineProofNodeWire[] | undefined,
): AnchorStatTerm {
  if (!statToProve || eventStatRoot === undefined) {
    throw new Error("incomplete_stat_term");
  }
  return {
    statToProve,
    eventStatRoot: toBytes32(eventStatRoot),
    statProof: toProofNodes(statProof),
  };
}

/** Two-stat 1X2 settlement args (soccer P1/P2 goal keys, subtract). */
export function buildValidateStatArgs(
  payload: TxlineStatValidationPayload,
  outcome: EscrowOutcome,
  programId: string = TXLINE_PROGRAM_ID,
  statKeys: TxlineHomeAwayStatKeys = txlineHomeAwayStatKeys(true),
): ValidateStatArgs {
  const summary = requireSummary(payload);
  const minTs = summary.updateStats!.minTimestamp;

  const stat1 = buildStatTerm(payload.statToProve, payload.eventStatRoot, payload.statProof);
  const stat2Key = payload.statToProve2?.key;
  const stat2 = payload.statToProve2
    ? buildStatTerm(payload.statToProve2, payload.eventStatRoot, payload.statProof2)
    : null;

  if (!stat2) {
    throw new Error("two_stat_validation_required");
  }
  if (stat1.statToProve.key !== statKeys.homeStatKey) {
    throw new Error(`expected_home_stat_${statKeys.homeStatKey}`);
  }
  if (stat2Key !== statKeys.awayStatKey) {
    throw new Error(`expected_away_stat_${statKeys.awayStatKey}`);
  }

  return {
    programId,
    targetTs: String(minTs),
    fixtureSummary: buildFixtureSummary(payload),
    fixtureProof: toProofNodes(payload.subTreeProof),
    mainTreeProof: toProofNodes(payload.mainTreeProof),
    predicate: predicateForOutcome(outcome),
    stat1,
    stat2,
    op: binaryOpFor1x2(),
    outcome,
    dailyScoresPdaSeeds: dailyScoresPdaSeeds(minTs),
  };
}
