import type { Fixture } from "@natt-pundit/contracts";
import { rememberFixtures } from "./fixtureArchive.js";

/**
 * Permanent WC fixture labels for pools that dropped off the TxLINE rolling snapshot.
 * Sources: handoff 259, merkle_verify tests, FIFA match reports (wallet audit 2026-07-10).
 */
const FIXTURE_META_SEED: Record<string, Omit<Fixture, "fixtureId">> = {
  "18185036": {
    homeTeam: "Canada",
    awayTeam: "Morocco",
    kickoffAt: "2026-07-04T17:00:00.000Z",
    status: "finished",
    competition: "World Cup",
    wcFormat: "knockout",
  },
  "18176123": {
    homeTeam: "Australia",
    awayTeam: "Egypt",
    kickoffAt: "2026-07-03T18:00:00.000Z",
    status: "finished",
    competition: "World Cup",
    wcFormat: "knockout",
  },
  "18187298": {
    homeTeam: "Brazil",
    awayTeam: "Norway",
    kickoffAt: "2026-07-05T20:00:00.000Z",
    status: "finished",
    competition: "World Cup",
    wcFormat: "knockout",
  },
  "18179551": {
    homeTeam: "Portugal",
    awayTeam: "Croatia",
    kickoffAt: "2026-07-02T19:00:00.000Z",
    status: "finished",
    competition: "World Cup",
    wcFormat: "group",
  },
  "18179549": {
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    kickoffAt: "2026-07-04T01:30:00.000Z",
    status: "finished",
    competition: "World Cup",
    wcFormat: "knockout",
  },
  "18179763": {
    homeTeam: "Mexico",
    awayTeam: "South Africa",
    kickoffAt: "2026-06-30T01:00:00.000Z",
    status: "finished",
    competition: "World Cup",
    wcFormat: "knockout",
  },
};

export function seedFixtureMeta(fixtureId: string): Fixture | null {
  const row = FIXTURE_META_SEED[fixtureId];
  if (!row) return null;
  return { fixtureId, ...row };
}

/** Persist seed entries into the permanent archive (idempotent). */
export function bootstrapFixtureMetaSeed(): void {
  const fixtures = Object.entries(FIXTURE_META_SEED).map(([fixtureId, meta]) => ({
    fixtureId,
    ...meta,
  }));
  rememberFixtures(fixtures);
}
