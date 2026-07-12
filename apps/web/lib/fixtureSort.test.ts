import type { Fixture, PublicEdgeSummaryItem } from "@natt-pundit/contracts";
import { describe, expect, it } from "vitest";
import { pickFeaturedFixture, sortFixtures } from "./fixtureSort";

function fx(id: string, kickoffAt: string, status: Fixture["status"] = "scheduled"): Fixture {
  return {
    fixtureId: id,
    homeTeam: "Home",
    awayTeam: "Away",
    kickoffAt,
    status,
    competition: "WC",
  };
}

function edge(fixtureId: string, status: PublicEdgeSummaryItem["status"]): PublicEdgeSummaryItem {
  return {
    fixtureId,
    verdict: "HOLD",
    conviction: "low",
    direction: null,
    hasOdds: true,
    status,
  };
}

describe("fixtureSort", () => {
  it("sorts live → scheduled (kickoff asc) → finished (kickoff desc)", () => {
    const fixtures = [
      fx("f1", "2026-07-10T18:00:00Z", "finished"),
      fx("f2", "2026-07-11T18:00:00Z", "scheduled"),
      fx("f3", "2026-07-09T18:00:00Z", "live"),
    ];
    const sorted = sortFixtures(fixtures, new Map());
    expect(sorted.map((f) => f.fixtureId)).toEqual(["f3", "f2", "f1"]);
  });

  it("keeps finished last even when kickoff is earlier than upcoming", () => {
    const fixtures = [
      fx("future", "2026-07-12T03:00:00Z", "scheduled"),
      fx("past", "2026-07-07T18:00:00Z", "finished"),
      fx("soon", "2026-07-09T22:00:00Z", "scheduled"),
    ];
    const sorted = sortFixtures(fixtures, new Map());
    expect(sorted.map((f) => f.fixtureId)).toEqual(["soon", "future", "past"]);
  });

  it("sorts scheduled soonest kickoff first", () => {
    const fixtures = [
      fx("d", "2026-07-12T03:00:00Z", "scheduled"),
      fx("b", "2026-07-10T21:00:00Z", "scheduled"),
      fx("a", "2026-07-09T22:00:00Z", "scheduled"),
      fx("c", "2026-07-11T23:00:00Z", "scheduled"),
    ];
    const sorted = sortFixtures(fixtures, new Map());
    expect(sorted.map((f) => f.fixtureId)).toEqual(["a", "b", "c", "d"]);
  });

  it("is stable for the same input", () => {
    const fixtures = [fx("a", "2026-07-10T18:00:00Z"), fx("b", "2026-07-11T18:00:00Z")];
    const edges = new Map<string, PublicEdgeSummaryItem>();
    const a = sortFixtures(fixtures, edges).map((f) => f.fixtureId);
    const b = sortFixtures(fixtures, edges).map((f) => f.fixtureId);
    expect(a).toEqual(b);
  });

  it("pickFeaturedFixture prefers live then scheduled", () => {
    const fixtures = [fx("f1", "2026-07-10T18:00:00Z"), fx("f2", "2026-07-11T18:00:00Z")];
    const edges = new Map<string, PublicEdgeSummaryItem>([
      ["f1", edge("f1", "scheduled")],
      ["f2", edge("f2", "live")],
    ]);
    expect(pickFeaturedFixture(fixtures, edges)?.fixtureId).toBe("f2");
  });

  it("pickFeaturedFixture falls back to most recent finished when no live or scheduled", () => {
    const fixtures = [
      fx("older", "2026-07-05T18:00:00Z", "finished"),
      fx("newer", "2026-07-10T18:00:00Z", "finished"),
    ];
    expect(pickFeaturedFixture(fixtures, new Map())?.fixtureId).toBe("newer");
  });
});
