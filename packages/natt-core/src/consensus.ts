import type { OddsLine } from "@natt-pundit/contracts";
import {
  MODEL_DRAW_TIE_BONUS,
  MODEL_MAX_ADJ,
  MODEL_MINUTE_COEF,
  MODEL_MOMENTUM_COEF,
  MODEL_SCORE_COEF,
} from "./config.js";
import { shinDevig } from "./shin.js";

export type ConsensusProbs = {
  home: number;
  draw?: number;
  away: number;
  selection: "home" | "away" | "draw";
  piTx: number;
  ts: string;
};

function parseSelection(
  selection: string,
): "home" | "away" | "draw" | null {
  const s = selection.toLowerCase();
  if (s.includes("home") || s === "1" || s === "h") return "home";
  if (s.includes("away") || s === "2" || s === "a") return "away";
  if (s.includes("draw") || s === "x" || s === "d") return "draw";
  return null;
}

function clampProb(p: number): number {
  return Math.min(Math.max(p, 0.02), 0.98);
}

function lineForSelection(
  lines: OddsLine[],
  selection: "home" | "away" | "draw",
): OddsLine | undefined {
  return lines.find((line) => parseSelection(line.selection) === selection);
}

function minuteProxy(events: Array<{ minute?: number }> | undefined): number {
  if (!events?.length) return 0;
  let max = 0;
  for (const ev of events) {
    if (typeof ev.minute === "number" && ev.minute > max) {
      max = ev.minute;
    }
  }
  return max;
}

/** Build Shin-adjusted TxLINE consensus from 1x2 odds lines. */
export function consensusFromOdds(
  lines: OddsLine[],
  ts: string,
): ConsensusProbs | null {
  const bySel: Partial<Record<"home" | "away" | "draw", number>> = {};
  for (const line of lines) {
    const sel = parseSelection(line.selection);
    if (!sel) continue;
    bySel[sel] = line.implied;
  }

  const home = bySel.home;
  const away = bySel.away;
  if (home === undefined || away === undefined) {
    const top = lines[0];
    if (!top) return null;
    return {
      home: top.implied,
      away: 1 - top.implied,
      selection: "home",
      piTx: top.implied,
      ts: top.ts ?? ts,
    };
  }

  const implied = bySel.draw !== undefined ? [home, bySel.draw, away] : [home, away];
  const fair = shinDevig(implied);

  if (fair.length === 3) {
    const ranked = [
      { sel: "home" as const, p: fair[0]! },
      { sel: "draw" as const, p: fair[1]! },
      { sel: "away" as const, p: fair[2]! },
    ].sort((a, b) => b.p - a.p);
    const best = ranked[0]!;
    return {
      home: fair[0]!,
      draw: fair[1],
      away: fair[2]!,
      selection: best.sel,
      piTx: best.p,
      ts,
    };
  }

  const pickHome = fair[0]! >= fair[1]!;
  return {
    home: fair[0]!,
    away: fair[1]!,
    selection: pickHome ? "home" : "away",
    piTx: pickHome ? fair[0]! : fair[1]!,
    ts,
  };
}

export type ModelFeatureInput = {
  homeScore: number;
  awayScore: number;
  selection: "home" | "away" | "draw";
  baseImplied: number;
  lines?: OddsLine[];
  events?: Array<{ minute?: number }>;
};

/**
 * Natt private model on pre-registered live features only (F67N).
 * Features: score diff, minute proxy, odds momentum (live vs open).
 */
export function modelProbFromFeatures(input: ModelFeatureInput): number {
  const diff = input.homeScore - input.awayScore;
  const minute = minuteProxy(input.events);
  const line = lineForSelection(input.lines ?? [], input.selection);
  const momentum =
    line && line.openImplied !== undefined ? line.implied - line.openImplied : 0;

  let adj = 0;
  if (input.selection === "home") {
    adj += diff * MODEL_SCORE_COEF;
  } else if (input.selection === "away") {
    adj -= diff * MODEL_SCORE_COEF;
  } else if (Math.abs(diff) < 0.5) {
    adj += MODEL_DRAW_TIE_BONUS;
  } else {
    adj -= MODEL_DRAW_TIE_BONUS;
  }

  adj += momentum * MODEL_MOMENTUM_COEF;
  adj += (minute / 90) * MODEL_MINUTE_COEF * Math.sign(diff || 1);

  if (adj > MODEL_MAX_ADJ) adj = MODEL_MAX_ADJ;
  if (adj < -MODEL_MAX_ADJ) adj = -MODEL_MAX_ADJ;

  return clampProb(input.baseImplied + adj);
}
