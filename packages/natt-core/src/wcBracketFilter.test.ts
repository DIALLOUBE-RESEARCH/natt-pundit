import { describe, expect, it } from "vitest";
import {
  filterKnockoutEliminatedFixtures,
  knockoutEliminatedTeams,
} from "./wcBracketFilter.js";

describe("wcBracketFilter", () => {
  it("marks France eliminated after semi loss to Spain", () => {
    const fixtures = [
      {
        fixtureId: "semi",
        homeTeam: "France",
        awayTeam: "Spain",
        kickoffAt: "2026-07-14T19:00:00.000Z",
        status: "finished" as const,
        wcFormat: "knockout" as const,
        score: { home: 0, away: 2 },
      },
      {
        fixtureId: "bronze",
        homeTeam: "France",
        awayTeam: "England",
        kickoffAt: "2026-07-18T21:00:00.000Z",
        status: "scheduled" as const,
        wcFormat: "knockout" as const,
      },
      {
        fixtureId: "final",
        homeTeam: "Spain",
        awayTeam: "Argentina",
        kickoffAt: "2026-07-19T19:00:00.000Z",
        status: "scheduled" as const,
        wcFormat: "knockout" as const,
      },
    ];

    const eliminated = knockoutEliminatedTeams(fixtures);
    expect(eliminated.get("France")).toBe(Date.parse("2026-07-14T19:00:00.000Z"));

    const visible = filterKnockoutEliminatedFixtures(fixtures);
    expect(visible.map((f) => f.fixtureId)).toEqual(["semi", "final"]);
  });

  it("keeps finished history even when teams are eliminated later", () => {
    const fixtures = [
      {
        fixtureId: "semi",
        homeTeam: "France",
        awayTeam: "Spain",
        kickoffAt: "2026-07-14T19:00:00.000Z",
        status: "finished" as const,
        wcFormat: "knockout" as const,
        score: { home: 0, away: 2 },
      },
    ];
    expect(filterKnockoutEliminatedFixtures(fixtures)).toHaveLength(1);
  });
});
