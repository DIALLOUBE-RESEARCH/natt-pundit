/**
 * Knockout bracket consistency: teams eliminated in a finished knockout match
 * must not appear in later scheduled fixtures (TxLINE may still list 3rd-place
 * or stale pairings — we hide them for the product surface).
 */
import {
  escrowOutcomeFromScore,
  wcMatchFormat,
  type WcMatchFormat,
} from "./wcMatchRules.js";

export type WcBracketFixture = {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  status: "scheduled" | "live" | "finished";
  score?: { home: number; away: number };
  wcFormat?: WcMatchFormat;
  penScore?: { home: number; away: number };
};

function fixtureFormat(f: WcBracketFixture): WcMatchFormat {
  return f.wcFormat ?? wcMatchFormat(f.kickoffAt);
}

function kickoffMs(f: WcBracketFixture): number {
  const ms = Date.parse(f.kickoffAt);
  return Number.isFinite(ms) ? ms : 0;
}

/** Team name -> kickoff ms of the knockout loss that eliminated them. */
export function knockoutEliminatedTeams(
  fixtures: WcBracketFixture[],
): Map<string, number> {
  const eliminated = new Map<string, number>();

  for (const f of fixtures) {
    if (f.status !== "finished") continue;
    if (fixtureFormat(f) !== "knockout") continue;
    if (!f.score) continue;

    const outcome = escrowOutcomeFromScore(f.score, "knockout", f.penScore);
    if (!outcome || outcome === "draw") continue;

    const loser = outcome === "home" ? f.awayTeam : f.homeTeam;
    const at = kickoffMs(f);
    const prev = eliminated.get(loser);
    if (prev === undefined || at > prev) eliminated.set(loser, at);
  }

  return eliminated;
}

export function isBracketVisibleFixture(
  f: WcBracketFixture,
  eliminated: Map<string, number>,
): boolean {
  if (f.status === "finished" || f.status === "live") return true;

  const kickoff = kickoffMs(f);
  for (const team of [f.homeTeam, f.awayTeam]) {
    const elimAt = eliminated.get(team);
    if (elimAt !== undefined && kickoff > elimAt) return false;
  }
  return true;
}

/** Drop scheduled fixtures that include a team already knocked out. */
export function filterKnockoutEliminatedFixtures<T extends WcBracketFixture>(
  fixtures: T[],
): T[] {
  const eliminated = knockoutEliminatedTeams(fixtures);
  if (eliminated.size === 0) return fixtures;
  return fixtures.filter((f) => isBracketVisibleFixture(f, eliminated));
}
