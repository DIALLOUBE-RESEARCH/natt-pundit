import type { EscrowOutcome } from "./cpi_args.js";
import {
  escrowOutcomeFromScore,
  type WcMatchFormat,
  resolveKnockoutWinner,
} from "./wcMatchRules.js";

export type CpiScoreTarget = {
  home: number;
  away: number;
  /** TxLINE stats 1002/1003 are regulation goals (90+ET), never pen shootout totals. */
  mode: "regulation";
};

export type CpiSettlementPlan =
  | { kind: "standard"; target: CpiScoreTarget; outcome: EscrowOutcome }
  | {
      kind: "knockout_tab";
      regulationTarget: CpiScoreTarget;
      penOutcome: EscrowOutcome;
      penScore: { home: number; away: number };
    };

/** Knockout went to penalty shootout with a decisive pen winner. */
export function isKnockoutTab(
  format: WcMatchFormat,
  score: { home: number; away: number },
  penScore?: { home: number; away: number },
): boolean {
  return (
    format === "knockout" &&
    score.home === score.away &&
    penScore !== undefined &&
    penScore.home !== penScore.away
  );
}

/** Regulation goal target for TxLINE CPI stats 1002/1003. */
export function resolveCpiScoreTarget(score: {
  home: number;
  away: number;
}): CpiScoreTarget {
  return { home: score.home, away: score.away, mode: "regulation" };
}

export function resolveCpiSettlementPlan(
  score: { home: number; away: number },
  format: WcMatchFormat,
  penScore: { home: number; away: number } | undefined,
  requestedOutcome: EscrowOutcome,
): CpiSettlementPlan {
  assertOutcomeConsistent(score, format, penScore, requestedOutcome);
  const regulationTarget = resolveCpiScoreTarget(score);
  if (isKnockoutTab(format, score, penScore)) {
    return {
      kind: "knockout_tab",
      regulationTarget,
      penOutcome: requestedOutcome,
      penScore: penScore!,
    };
  }
  return { kind: "standard", target: regulationTarget, outcome: requestedOutcome };
}

export function statsImplyOutcome(
  home: number,
  away: number,
  outcome: EscrowOutcome,
): boolean {
  const diff = home - away;
  if (outcome === "home") return diff > 0;
  if (outcome === "draw") return diff === 0;
  return diff < 0;
}

export function validationMatchesCpiTarget(
  home: number | undefined,
  away: number | undefined,
  target: CpiScoreTarget,
): boolean {
  if (home === undefined || away === undefined) return false;
  return home === target.home && away === target.away;
}

/** Any tied regulation score in the Merkle tree (for knockout TAB tie CPI). */
export function validationIsRegulationTie(
  home: number | undefined,
  away: number | undefined,
): boolean {
  if (home === undefined || away === undefined) return false;
  return home === away;
}

export function resolveSettleOutcome(
  score: { home: number; away: number },
  format: WcMatchFormat,
  penScore?: { home: number; away: number },
): EscrowOutcome | null {
  return escrowOutcomeFromScore(score, format, penScore);
}

export function assertOutcomeConsistent(
  score: { home: number; away: number },
  format: WcMatchFormat,
  penScore: { home: number; away: number } | undefined,
  outcome: EscrowOutcome,
): void {
  const expected = resolveSettleOutcome(score, format, penScore);
  if (expected === null) {
    throw new Error("cpi_outcome_undetermined: match result not decisive yet");
  }
  if (expected !== outcome) {
    throw new Error(
      `cpi_outcome_mismatch: expected ${expected} for ${format} score ${score.home}-${score.away}` +
        (penScore ? ` pens ${penScore.home}-${penScore.away}` : ""),
    );
  }
  if (format === "knockout" && outcome === "draw") {
    throw new Error("cpi_outcome_draw_invalid_knockout");
  }
}

export { resolveKnockoutWinner };
