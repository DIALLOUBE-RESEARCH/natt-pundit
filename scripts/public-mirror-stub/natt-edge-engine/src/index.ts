import type { EdgeVerdict } from "@natt-pundit/contracts";

/** Public mirror stub — edge runs on hosted hypernatt.com only. */
export const EPSILON_NET = 0.03;
export const MAX_1X2_HOME_JUMP = 0.12;
export const SETUP_LATCH_MS = 900_000;
export const SETUP_LATCH_INVALIDATE = -0.02;
export const EDGE_FORMULA_VERSION = "f70n_v2";
export const N_MIN_FIT = 500;
export const CLV_MIN_DISPLAY = 30;
export const CLV_BOOTSTRAP_ITERS = 200;
export const CLV_BLOCK_SIZE = 5;
export const CLV_SEED = 12345;

export type EdgeInput = {
  fixtureId: string;
  lines: unknown[];
  ts: string;
};

export function computeEdgeVerdict(input: EdgeInput): EdgeVerdict {
  return {
    fixtureId: input.fixtureId,
    verdict: "HOLD",
    edge_score: 0,
    why: "Public mirror stub — use https://hypernatt.com API for live edge.",
    ts: input.ts,
    direction: "none",
    pi_tx: 0,
    pi_model: 0,
    c: 0,
    epsilon_net: EPSILON_NET,
  };
}

export function computeOutcomeDecomposition(): null {
  return null;
}

export function computeClv(): number {
  return 0;
}

export function meanClvWithCi() {
  return { mean: 0, lo: 0, hi: 0, n: 0 };
}

export function clvVerdict() {
  return "not_verified_yet" as const;
}

export function convictionFromEdgeScore(edgeScore: number): "none" | "low" | "medium" | "high" {
  if (edgeScore <= 0) return "none";
  if (edgeScore < 0.04) return "low";
  if (edgeScore < 0.08) return "medium";
  return "high";
}
