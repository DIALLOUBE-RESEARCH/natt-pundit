import { describe, expect, it, beforeEach } from "vitest";
import {
  detectMomentDrafts,
  draftToMoment,
  getReadyMoments,
  markInFlight,
  markMomentDraftSeen,
  storeMoment,
} from "./detectMoments.js";
import type { ScoresSnapshot } from "@natt-pundit/contracts";

function scores(partial: Partial<ScoresSnapshot> & Pick<ScoresSnapshot, "score">): ScoresSnapshot {
  return {
    fixtureId: "1",
    score: partial.score,
    clock: partial.clock ?? { phase: "1H", running: true, minute: 30 },
    events: partial.events ?? [],
    ts: new Date().toISOString(),
    participant1IsHome: true,
  };
}

describe("detectMoments", () => {
  beforeEach(() => {
    // isolate fixture watch state per test via unique fixture ids
  });

  it("detects_new_live_goal_after_baseline_seed", () => {
    const fx = "live-goal-1";
    const base = scores({
      score: { home: 0, away: 0 },
      events: [],
    });
    detectMomentDrafts(fx, base, "Argentina", "Cape Verde");
    const afterGoal = scores({
      score: { home: 1, away: 0 },
      events: [{ type: "goal", minute: 28, team: "home" }],
    });
    const drafts = detectMomentDrafts(fx, afterGoal, "Argentina", "Cape Verde");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.eventType).toBe("GOAL");
  });

  it("does_not_redetect_goal_after_moment_stored", () => {
    const fx = "live-goal-2";
    const before = scores({
      score: { home: 0, away: 0 },
      events: [],
    });
    detectMomentDrafts(fx, before, "Argentina", "Cape Verde");
    const snap = scores({
      score: { home: 1, away: 0 },
      events: [{ type: "goal", minute: 28, team: "home" }],
    });
    const drafts = detectMomentDrafts(fx, snap, "Argentina", "Cape Verde");
    expect(drafts).toHaveLength(1);
    const draft = drafts[0]!;
    expect(markInFlight(draft.momentId, "fr")).toBe(true);
    storeMoment(draftToMoment(draft, fx, "fr", ""));
    markMomentDraftSeen(fx, draft);
    const again = detectMomentDrafts(fx, snap, "Argentina", "Cape Verde");
    expect(again).toHaveLength(0);
    expect(getReadyMoments(fx, "fr", new Set())).toHaveLength(1);
  });

  it("skips_goals_already_present_on_first_live_seed", () => {
    const fx = "join-late-1";
    const snap = scores({
      score: { home: 1, away: 0 },
      events: [{ type: "goal", minute: 28, team: "home" }],
    });
    const drafts = detectMomentDrafts(fx, snap, "Argentina", "Cape Verde");
    expect(drafts).toHaveLength(0);
  });
});
