import type { EdgeVerdict, OddsLine } from "@natt-pundit/contracts";
import { combineProbs, edgeOverConsensus } from "./combine.js";
import {
  consensusFromOdds,
  modelProbFromFeatures,
  type ConsensusProbs,
} from "./consensus.js";
import { COMBINE_ALPHA, COMBINE_BETA, EPSILON_NET } from "./config.js";

export type EdgeInput = {
  fixtureId: string;
  lines: OddsLine[];
  homeScore?: number;
  awayScore?: number;
  events?: Array<{ minute?: number }>;
  ts: string;
  epsilonNet?: number;
};

function directionFromSelection(
  selection: ConsensusProbs["selection"],
): "home" | "away" | "draw" | "none" {
  return selection ?? "none";
}

export function computeEdgeVerdict(input: EdgeInput): EdgeVerdict {
  const ts = input.ts;
  const epsilon = input.epsilonNet ?? EPSILON_NET;
  const consensus = consensusFromOdds(input.lines, ts);

  if (!consensus) {
    return {
      fixtureId: input.fixtureId,
      verdict: "HOLD",
      edge_score: 0,
      why: "Cotes TxLINE indisponibles — fail-closed HOLD.",
      ts,
      direction: "none",
      pi_tx: 0,
      pi_model: 0,
      c: 0,
      epsilon_net: epsilon,
    };
  }

  const piTx = consensus.piTx;
  const piModel = modelProbFromFeatures({
    homeScore: input.homeScore ?? 0,
    awayScore: input.awayScore ?? 0,
    selection: consensus.selection,
    baseImplied: piTx,
    lines: input.lines,
    events: input.events,
  });

  const c = combineProbs({
    piTx,
    piModel,
    alpha: COMBINE_ALPHA,
    beta: COMBINE_BETA,
  });

  const edgeScore = edgeOverConsensus(c, piTx);

  if (edgeScore <= epsilon) {
    return {
      fixtureId: input.fixtureId,
      verdict: "HOLD",
      edge_score: edgeScore,
      why: `c - pi_tx = ${edgeScore.toFixed(3)} <= epsilon_net ${epsilon} — pas de setup net.`,
      ts,
      direction: "none",
      pi_tx: piTx,
      pi_model: piModel,
      c,
      epsilon_net: epsilon,
    };
  }

  return {
    fixtureId: input.fixtureId,
    verdict: "SETUP",
    edge_score: edgeScore,
    why: `c - pi_tx = ${edgeScore.toFixed(3)} > epsilon_net ${epsilon} — edge mesurable vs consensus Shin.`,
    ts,
    direction: directionFromSelection(consensus.selection),
    pi_tx: piTx,
    pi_model: piModel,
    c,
    epsilon_net: epsilon,
  };
}
