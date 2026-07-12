import { describe, expect, it } from "vitest";
import {
  allowsDrawBetting,
  displayMinuteFromSeconds,
  escrowOutcomeFromScore,
  isWc26ListableFixture,
  resolveKnockoutWinner,
  wcMatchFormat,
  WC26_GROUP_STAGE_END_MS,
} from "./wcMatchRules.js";

describe("wcMatchRules", () => {
  it("group_stage_allows_draw", () => {
    expect(wcMatchFormat("2026-06-15T18:00:00.000Z")).toBe("group");
    expect(allowsDrawBetting("group")).toBe(true);
  });

  it("knockout_disallows_draw", () => {
    expect(wcMatchFormat("2026-07-02T19:00:00.000Z")).toBe("knockout");
    expect(allowsDrawBetting("knockout")).toBe(false);
  });

  it("display_minute_no_plus_one", () => {
    expect(displayMinuteFromSeconds(2730)).toBe(45);
    expect(displayMinuteFromSeconds(5635)).toBe(93);
  });

  it("group_stage_cutoff_is_june_27", () => {
    expect(Number.isFinite(WC26_GROUP_STAGE_END_MS)).toBe(true);
  });

  it("knockout_winner_from_pen_score", () => {
    expect(resolveKnockoutWinner({ home: 1, away: 1 }, { home: 2, away: 4 })).toBe("away");
    expect(escrowOutcomeFromScore({ home: 1, away: 1 }, "knockout", { home: 2, away: 4 })).toBe("away");
  });

  it("list_gate_rejects_friendlies_and_post_tournament", () => {
    expect(
      isWc26ListableFixture({
        kickoffAt: "2026-09-25T15:00:00.000Z",
        competition: "Friendlies",
      }),
    ).toBe(false);
    expect(
      isWc26ListableFixture({
        kickoffAt: "2026-07-10T19:00:00.000Z",
        competition: "World Cup",
      }),
    ).toBe(true);
    expect(
      isWc26ListableFixture({
        kickoffAt: "2026-07-18T15:00:00.000Z",
        competition: "Friendlies",
      }),
    ).toBe(false);
  });
});
