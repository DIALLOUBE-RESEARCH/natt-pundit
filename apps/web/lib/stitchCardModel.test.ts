import { describe, expect, it } from "vitest";
import { fixtureToStitchCard, matchEdgeToSummaryItem } from "./stitchCardModel";
import type { PublicMatchEdge } from "@natt-pundit/contracts";

describe("matchEdgeToSummaryItem", () => {
  it("maps match edge payload to summary item for cards", () => {
    const data = {
      fixture: {
        fixtureId: "fx1",
        homeTeam: "France",
        awayTeam: "Morocco",
        kickoffAt: "2026-07-09T20:00:00Z",
        status: "scheduled" as const,
        competition: "WC",
      },
      odds: [{ selection: "home", implied: 1.5, ts: "2026-07-08T00:00:00Z" }],
      edge: {
        verdict: "SETUP" as const,
        conviction: "high" as const,
        direction: "home" as const,
        why: "test",
      },
      scores: {
        events: [],
        clock: { phase: "NS" as const, minute: 0 },
      },
    } satisfies PublicMatchEdge;

    const item = matchEdgeToSummaryItem(data);
    expect(item.fixtureId).toBe("fx1");
    expect(item.verdict).toBe("SETUP");
    expect(item.hasOdds).toBe(true);
    expect(item.status).toBe("scheduled");
    expect(item.clock?.phase).toBe("NS");
  });

  it("setup pill uses conviction and team, not placeholder score", () => {
    const fixture = {
      fixtureId: "fx2",
      homeTeam: "Norway",
      awayTeam: "England",
      kickoffAt: "2026-07-11T21:00:00Z",
      status: "scheduled" as const,
      competition: "WC",
    };
    const edge = {
      fixtureId: "fx2",
      verdict: "SETUP" as const,
      conviction: "medium" as const,
      direction: "away" as const,
      hasOdds: true,
      status: "scheduled" as const,
    };
    const card = fixtureToStitchCard(fixture, edge, "en");
    expect(card.isSetup).toBe(true);
    expect(card.setup).toBe("");
    expect(card.hold).toBe("");
  });
});
