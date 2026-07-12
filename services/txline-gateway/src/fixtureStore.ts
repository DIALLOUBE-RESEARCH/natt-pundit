import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Fixture } from "@natt-pundit/contracts";
import { filterWc26ListableFixtures, isWc26ListableFixture } from "@natt-pundit/natt-core";
import { rememberFixtures } from "./fixtureArchive.js";

/**
 * Disk-backed fixture store.
 *
 * TxLine's `/api/fixtures/snapshot` is a rolling window: once a match finishes
 * (or is transiently omitted) it drops out of the snapshot, which would make the
 * card + edge + match page vanish even though its scores stay queryable by id.
 * This store remembers every fixture seen and keeps it visible for
 * RETENTION_MS after kickoff, so finished matches persist and live matches never
 * flicker out because of a single flaky snapshot.
 */

const STORE_PATH = process.env.FIXTURE_STORE_PATH ?? "/data/fixtures-store.json";
const RETENTION_MS =
  Number(process.env.FIXTURE_RETENTION_HOURS ?? 36) * 60 * 60 * 1000;
const MAX_ENTRIES = Number(process.env.FIXTURE_STORE_MAX ?? 300);

export type StoredFixture = { fixture: Fixture; lastSeenAt: number };
export type FixtureStore = Record<string, StoredFixture>;

function kickoffMs(f: Fixture): number {
  const t = new Date(f.kickoffAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Pure merge: union of the live snapshot and previously-seen fixtures whose
 * kickoff is within the retention window. Live entries always win on conflict
 * (freshest metadata). Deterministic — unit-tested without touching disk.
 */
export function mergeWithStore(
  live: Fixture[],
  prev: FixtureStore,
  now: number,
  retentionMs: number = RETENTION_MS,
  maxEntries: number = MAX_ENTRIES,
): { fixtures: Fixture[]; next: FixtureStore } {
  const merged: FixtureStore = {};

  for (const [id, entry] of Object.entries(prev)) {
    if (!isWc26ListableFixture(entry.fixture)) continue;
    if (kickoffMs(entry.fixture) >= now - retentionMs) merged[id] = entry;
  }
  for (const f of live) {
    merged[f.fixtureId] = { fixture: f, lastSeenAt: now };
  }

  let kept = Object.values(merged).filter((e) => isWc26ListableFixture(e.fixture));
  if (kept.length > maxEntries) {
    kept = kept
      .sort((a, b) => kickoffMs(b.fixture) - kickoffMs(a.fixture))
      .slice(0, maxEntries);
  }

  const next: FixtureStore = {};
  for (const e of kept) next[e.fixture.fixtureId] = e;

  const fixtures = kept
    .map((e) => e.fixture)
    .sort((a, b) => kickoffMs(a) - kickoffMs(b));

  return { fixtures, next };
}

function loadStore(): FixtureStore {
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as FixtureStore;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // Missing or corrupt file -> start empty. Best-effort persistence must never
    // block serving fixtures.
  }
  return {};
}

function persist(store: FixtureStore): void {
  try {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(store), "utf8");
  } catch (err) {
    console.warn(
      `[fixtureStore] persist failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

let store: FixtureStore = loadStore();

/**
 * Merge the live snapshot into the persistent store, evict stale entries, save
 * to disk, and return the full visible fixture list (sorted by kickoff asc).
 */
export function reconcileFixtures(live: Fixture[]): Fixture[] {
  const wcLive = filterWc26ListableFixtures(live);
  const now = Date.now();
  const { fixtures, next } = mergeWithStore(wcLive, store, now);
  store = next;
  persist(store);
  rememberFixtures(fixtures);
  rememberFixtures(wcLive);
  return fixtures;
}

/** Read a fixture from the rolling store without refreshing the live snapshot. */
export function lookupStoredFixture(fixtureId: string): Fixture | null {
  const fromMem = store[fixtureId]?.fixture;
  if (fromMem) return fromMem;
  const disk = loadStore();
  return disk[fixtureId]?.fixture ?? null;
}
