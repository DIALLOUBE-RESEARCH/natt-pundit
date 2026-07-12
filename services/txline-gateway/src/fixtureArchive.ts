import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Fixture } from "@natt-pundit/contracts";

/**
 * Permanent fixture archive for wallet history / settled matches.
 * Unlike fixtureStore rolling retention, entries are never evicted here.
 */
const ARCHIVE_PATH = process.env.FIXTURE_ARCHIVE_PATH ?? "/data/fixture-archive.json";

export type FixtureArchive = Record<string, Fixture>;

function loadArchive(): FixtureArchive {
  try {
    const raw = readFileSync(ARCHIVE_PATH, "utf8");
    const parsed = JSON.parse(raw) as FixtureArchive;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* start empty */
  }
  return {};
}

function persistArchive(archive: FixtureArchive): void {
  try {
    mkdirSync(dirname(ARCHIVE_PATH), { recursive: true });
    writeFileSync(ARCHIVE_PATH, JSON.stringify(archive), "utf8");
  } catch (err) {
    console.warn(
      `[fixtureArchive] persist failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

let archive: FixtureArchive = loadArchive();

function archiveEntryChanged(prev: Fixture | undefined, next: Fixture): boolean {
  if (!prev) return true;
  return (
    prev.homeTeam !== next.homeTeam ||
    prev.awayTeam !== next.awayTeam ||
    prev.status !== next.status ||
    prev.kickoffAt !== next.kickoffAt ||
    prev.score?.home !== next.score?.home ||
    prev.score?.away !== next.score?.away
  );
}

export function rememberFixtures(fixtures: Fixture[]): void {
  let changed = false;
  for (const f of fixtures) {
    if (archiveEntryChanged(archive[f.fixtureId], f)) {
      archive[f.fixtureId] = f;
      changed = true;
    }
  }
  if (changed) persistArchive(archive);
}

/** All permanently archived fixtures (never evicted — jury / wallet history). */
export function listArchivedFixtures(): Fixture[] {
  return Object.values(archive);
}

export function lookupArchivedFixture(fixtureId: string): Fixture | null {
  return archive[fixtureId] ?? null;
}

/** Test helper — replace in-memory archive. */
export function replaceFixtureArchive(next: FixtureArchive): void {
  archive = { ...next };
}
