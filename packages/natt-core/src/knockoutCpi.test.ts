import { describe, expect, it } from "vitest";
import {
  assertOutcomeConsistent,
  isKnockoutTab,
  resolveCpiScoreTarget,
  resolveCpiSettlementPlan,
  statsImplyOutcome,
  validationIsRegulationTie,
  validationMatchesCpiTarget,
} from "./knockoutCpi.js";

describe("knockoutCpi", () => {
  it("uses_regulation_goals_not_pen_totals", () => {
    const t = resolveCpiScoreTarget({ home: 1, away: 1 });
    expect(t).toEqual({ home: 1, away: 1, mode: "regulation" });
  });

  it("detects_knockout_tab", () => {
    expect(isKnockoutTab("knockout", { home: 1, away: 1 }, { home: 2, away: 4 })).toBe(true);
    expect(isKnockoutTab("knockout", { home: 2, away: 1 })).toBe(false);
  });

  it("plan_standard_for_decisive_knockout", () => {
    const plan = resolveCpiSettlementPlan(
      { home: 2, away: 1 },
      "knockout",
      undefined,
      "home",
    );
    expect(plan.kind).toBe("standard");
    if (plan.kind === "standard") {
      expect(plan.target).toEqual({ home: 2, away: 1, mode: "regulation" });
    }
  });

  it("plan_knockout_tab_for_pen_winner", () => {
    const plan = resolveCpiSettlementPlan(
      { home: 1, away: 1 },
      "knockout",
      { home: 2, away: 4 },
      "away",
    );
    expect(plan.kind).toBe("knockout_tab");
    if (plan.kind === "knockout_tab") {
      expect(plan.regulationTarget).toEqual({ home: 1, away: 1, mode: "regulation" });
      expect(plan.penOutcome).toBe("away");
    }
  });

  it("stats_imply_outcome", () => {
    expect(statsImplyOutcome(2, 1, "home")).toBe(true);
    expect(statsImplyOutcome(1, 1, "draw")).toBe(true);
    expect(statsImplyOutcome(0, 1, "away")).toBe(true);
    expect(statsImplyOutcome(1, 1, "away")).toBe(false);
  });

  it("validation_matches_regulation_target", () => {
    const target = resolveCpiScoreTarget({ home: 1, away: 1 });
    expect(validationMatchesCpiTarget(1, 1, target)).toBe(true);
    expect(validationMatchesCpiTarget(1, 0, target)).toBe(false);
  });

  it("validation_is_regulation_tie", () => {
    expect(validationIsRegulationTie(1, 1)).toBe(true);
    expect(validationIsRegulationTie(1, 0)).toBe(false);
  });

  it("assert_outcome_egypt_tab", () => {
    expect(() =>
      assertOutcomeConsistent(
        { home: 1, away: 1 },
        "knockout",
        { home: 2, away: 4 },
        "away",
      ),
    ).not.toThrow();
    expect(() =>
      assertOutcomeConsistent(
        { home: 1, away: 1 },
        "knockout",
        { home: 2, away: 4 },
        "home",
      ),
    ).toThrow(/cpi_outcome_mismatch/);
  });
});
