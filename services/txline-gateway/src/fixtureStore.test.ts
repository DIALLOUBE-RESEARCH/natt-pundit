import { describe, expect, it } from "vitest";
import type { Fixture } from "@natt-pundit/contracts";
import { mergeWithStore, type FixtureStore } from "./fixtureStore.js";

const HOUR = 60 * 60 * 1000;

function fx(id: string, kickoffMsFromNow: number, now: number, extra: Partial<Fixture> = {}): Fixture {
  return {
    fixtureId: id,
    homeTeam: `H${id}`,
    awayTeam: `A${id}`,
    kickoffAt: new Date(now + kickoffMsFromNow).toISOString(),
    status: "scheduled",
    ...extra,
  };
}

function storeOf(entries: Array<{ f: Fixture; seen: number }>): FixtureStore {
  const s: FixtureStore = {};
  for (const e of entries) s[e.f.fixtureId] = { fixture: e.f, lastSeenAt: e.seen };
  return s;
}

describe("fixtureStore.mergeWithStore", () => {
  const now = 1_700_000_000_000;

  it("keeps a recently-finished match that dropped from the live snapshot", () => {
    const finished = fx("100", -2 * HOUR, now, { status: "finished" });
    const prev = storeOf([{ f: finished, seen: now - HOUR }]);
    const live = [fx("200", 3 * HOUR, now)]; // snapshot no longer has 100

    const { fixtures } = mergeWithStore(live, prev, now);

    expect(fixtures.map((f) => f.fixtureId).sort()).toEqual(["100", "200"]);
  });

  it("evicts a match older than the retention window", () => {
    const stale = fx("100", -40 * HOUR, now); // kickoff 40h ago > 36h retention
    const prev = storeOf([{ f: stale, seen: now - 40 * HOUR }]);
    const live: Fixture[] = [];

    const { fixtures, next } = mergeWithStore(live, prev, now);

    expect(fixtures).toHaveLength(0);
    expect(next["100"]).toBeUndefined();
  });

  it("lets the live snapshot win on conflict (freshest metadata)", () => {
    const oldVersion = fx("100", 1 * HOUR, now, { status: "scheduled" });
    const prev = storeOf([{ f: oldVersion, seen: now - HOUR }]);
    const liveVersion = fx("100", 1 * HOUR, now, { status: "live", score: { home: 1, away: 0 } });

    const { fixtures } = mergeWithStore([liveVersion], prev, now);

    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].status).toBe("live");
    expect(fixtures[0].score).toEqual({ home: 1, away: 0 });
  });

  it("returns fixtures sorted by kickoff ascending", () => {
    const prev = storeOf([{ f: fx("A", -2 * HOUR, now), seen: now }]);
    const live = [fx("B", 5 * HOUR, now), fx("C", 1 * HOUR, now)];

    const { fixtures } = mergeWithStore(live, prev, now);

    expect(fixtures.map((f) => f.fixtureId)).toEqual(["A", "C", "B"]);
  });

  it("caps the store to maxEntries keeping the most recent kickoffs", () => {
    const prev = storeOf([
      { f: fx("old", -30 * HOUR, now), seen: now },
      { f: fx("mid", -10 * HOUR, now), seen: now },
    ]);
    const live = [fx("new", 1 * HOUR, now)];

    const { fixtures, next } = mergeWithStore(live, prev, now, 36 * HOUR, 2);

    expect(fixtures.map((f) => f.fixtureId)).toEqual(["mid", "new"]);
    expect(Object.keys(next).sort()).toEqual(["mid", "new"]);
  });
});
