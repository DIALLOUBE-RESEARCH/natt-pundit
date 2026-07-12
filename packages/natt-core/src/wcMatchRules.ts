/**
 * FIFA World Cup 2026 tournament format (FIFA regulations Art. 12–14).
 * Group stage: 1X2 including draw (90 min).
 * Knockout: no draw — extra time (2×15 min) then penalties if still level.
 */

/** Last group-stage kickoff window ends 27 Jun 2026 UTC (FIFA WC26 schedule). */
export const WC26_GROUP_STAGE_END_MS = Date.parse("2026-06-27T23:59:59.999Z");

/** FIFA WC 2026 tournament window (list UI + archive gate). */
export const WC26_TOURNAMENT_START_MS = Date.parse("2026-06-01T00:00:00.000Z");
export const WC26_TOURNAMENT_END_MS = Date.parse("2026-07-19T23:59:59.999Z");

export type WcFixtureListGate = {
  kickoffAt: string;
  competition?: string;
};

/** True when a fixture belongs on the WC26 product surface (not friendlies / other comps). */
export function isWc26ListableFixture(f: WcFixtureListGate): boolean {
  const ms = Date.parse(f.kickoffAt);
  if (!Number.isFinite(ms) || ms < WC26_TOURNAMENT_START_MS || ms > WC26_TOURNAMENT_END_MS) {
    return false;
  }
  const comp = f.competition?.trim().toLowerCase();
  if (comp && !comp.includes("world cup")) return false;
  return true;
}

export function filterWc26ListableFixtures<T extends WcFixtureListGate>(fixtures: T[]): T[] {
  return fixtures.filter(isWc26ListableFixture);
}

export type WcMatchFormat = "group" | "knockout";

export function wcMatchFormat(kickoffAt: string): WcMatchFormat {
  const ms = Date.parse(kickoffAt);
  if (!Number.isFinite(ms)) return "group";
  return ms <= WC26_GROUP_STAGE_END_MS ? "group" : "knockout";
}

/** Parimutuel escrow: draw outcome only in group stage (90-min 1X2). */
export function allowsDrawBetting(format: WcMatchFormat): boolean {
  return format === "group";
}

/** Display minute from TxLINE running seconds (0-based elapsed minutes). */
export function displayMinuteFromSeconds(seconds: number): number {
  return Math.min(130, Math.max(0, Math.floor(seconds / 60)));
}

/** Knockout winner: penalty shootout score first, else 90+ET goals. */
export function resolveKnockoutWinner(
  score: { home: number; away: number },
  penScore?: { home: number; away: number },
): "home" | "away" | null {
  if (penScore && penScore.home !== penScore.away) {
    return penScore.home > penScore.away ? "home" : "away";
  }
  if (score.home !== score.away) {
    return score.home > score.away ? "home" : "away";
  }
  return null;
}

/** Escrow settlement outcome from live score (group = 1X2; knockout = winner incl. TAB). */
export function escrowOutcomeFromScore(
  score: { home: number; away: number },
  format: WcMatchFormat,
  penScore?: { home: number; away: number },
): "home" | "draw" | "away" | null {
  if (format === "knockout") {
    const w = resolveKnockoutWinner(score, penScore);
    return w;
  }
  if (score.home > score.away) return "home";
  if (score.away > score.home) return "away";
  return "draw";
}
