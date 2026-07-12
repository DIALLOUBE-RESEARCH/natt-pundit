import type { Fixture } from "@natt-pundit/contracts";
import { describe, expect, it } from "vitest";
import { mergeVisibleWithArchive } from "./fixtureListMerge.js";

function fx(
  id: string,
  kickoffAt: string,
  extra: Partial<Fixture> = {},
): Fixture {
  return {
    fixtureId: id,
    homeTeam: `H${id}`,
    awayTeam: `A${id}`,
    kickoffAt,
    status: "scheduled",
    ...extra,
  };
}

describe("mergeVisibleWithArchive", () => {
  it("adds archived fixtures missing from the rolling visible list", () => {
    const archived = [fx("old", "2026-07-01T18:00:00Z", { status: "finished" })];
    const visible = [fx("live", "2026-07-12T18:00:00Z", { status: "scheduled" })];

    const merged = mergeVisibleWithArchive(visible, archived);

    expect(merged.map((f) => f.fixtureId)).toEqual(["old", "live"]);
  });

  it("lets visible fixtures win on id conflict", () => {
    const archived = [fx("100", "2026-07-10T18:00:00Z", { status: "finished" })];
    const visible = [
      fx("100", "2026-07-10T18:00:00Z", {
        status: "live",
        score: { home: 2, away: 1 },
      }),
    ];

    const merged = mergeVisibleWithArchive(visible, archived);

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("live");
    expect(merged[0].score).toEqual({ home: 2, away: 1 });
  });

  it("returns kickoff-asc sorted fixtures", () => {
    const archived = [fx("c", "2026-07-11T18:00:00Z")];
    const visible = [fx("a", "2026-07-09T18:00:00Z"), fx("b", "2026-07-10T18:00:00Z")];

    const merged = mergeVisibleWithArchive(visible, archived);

    expect(merged.map((f) => f.fixtureId)).toEqual(["a", "b", "c"]);
  });
});
