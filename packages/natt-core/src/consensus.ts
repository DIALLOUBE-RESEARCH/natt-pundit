import type { OddsLine } from "@natt-pundit/contracts";
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

/**
 * True 1X2 lines only (F70N T8). The odds feed sends one market per tick
 * (1X2 / OU / AH / LINE); an Asian-handicap line also has a "home"/"away"
 * selection, so without this filter it would corrupt the 1X2 consensus. Lines
 * with no market are treated as 1X2 (test fixtures / legacy). Case-insensitive.
 */
export function is1x2Line(line: { market?: string }): boolean {
  return (line.market ?? "1X2").toLowerCase() === "1x2";
}

/** Keep only the true 1X2 lines. Pure. */
export function only1x2Lines<T extends { market?: string }>(lines: T[]): T[] {
  return lines.filter(is1x2Line);
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

/** Elapsed match minutes from kickoff (0–120), independent of score events. */
export function minuteFromKickoff(kickoffAt: string, now: Date = new Date()): number {
  const kickoffMs = new Date(kickoffAt).getTime();
  if (!Number.isFinite(kickoffMs)) return 0;
  const elapsedMin = Math.floor((now.getTime() - kickoffMs) / 60_000);
  return Math.min(120, Math.max(0, elapsedMin));
}

/** Raw book implied for a selection (pre-Shin), used as pi_model base. */
export function selectionRawImplied(
  lines: OddsLine[],
  selection: "home" | "away" | "draw",
): number {
  const only = only1x2Lines(lines);
  const line = lineForSelection(only, selection);
  if (line) return line.implied;
  const fallback = only.find((l) => parseSelection(l.selection) !== null);
  return fallback?.implied ?? 0.5;
}

/**
 * Shin-devigged fair probability of a SPECIFIC selection (F70N T7). Unlike
 * consensusFromOdds (which returns the argmax pick), this lets the CLV harness
 * follow the ORIGINAL picked direction over time to measure line movement.
 * Returns null when the market is missing that side. Pure.
 */
export function fairProbForSelection(
  lines: Array<{ selection: string; implied: number; market?: string }>,
  selection: "home" | "away" | "draw",
): number | null {
  const bySel: Partial<Record<"home" | "away" | "draw", number>> = {};
  for (const line of lines) {
    if (!is1x2Line(line)) continue;
    const sel = parseSelection(line.selection);
    if (sel) bySel[sel] = line.implied;
  }
  const home = bySel.home;
  const away = bySel.away;
  if (home === undefined || away === undefined) return null;
  const hasDraw = bySel.draw !== undefined;
  const implied = hasDraw ? [home, bySel.draw!, away] : [home, away];
  const fair = shinDevig(implied);
  if (hasDraw) {
    if (selection === "home") return fair[0]!;
    if (selection === "draw") return fair[1]!;
    return fair[2]!;
  }
  if (selection === "draw") return null;
  return selection === "home" ? fair[0]! : fair[1]!;
}

/** Build Shin-adjusted TxLINE consensus from 1x2 odds lines. */
export function consensusFromOdds(
  lines: OddsLine[],
  ts: string,
): ConsensusProbs | null {
  const only = only1x2Lines(lines);
  const bySel: Partial<Record<"home" | "away" | "draw", number>> = {};
  for (const line of only) {
    const sel = parseSelection(line.selection);
    if (!sel) continue;
    bySel[sel] = line.implied;
  }

  const home = bySel.home;
  const away = bySel.away;
  if (home === undefined || away === undefined) {
    const top = only[0];
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

