import { describe, expect, it } from "vitest";
import { buildMomentId } from "./commentary_moment.js";
import { renderCommentary } from "./commentary_render.js";
import { COMMENTARY_LANGS } from "./commentary_types.js";

const baseVars = {
  player: "Ronaldo",
  team: "Portugal",
  minute: 68,
  scoreHome: 2,
  scoreAway: 1,
  homeTeam: "Portugal",
  awayTeam: "Croatia",
};

describe("renderCommentary", () => {
  it("renders_goal_fr_without_braces", () => {
    const text = renderCommentary("GOAL", "fr", baseVars);
    expect(text).toContain("But!");
    expect(text).toContain("Ronaldo");
    expect(text).not.toMatch(/[{}]/);
  });

  it("renders_goal_all_8_langs", () => {
    for (const lang of COMMENTARY_LANGS) {
      const text = renderCommentary("GOAL", lang, baseVars);
      expect(text.length).toBeGreaterThan(10);
      expect(text).not.toMatch(/[{}]/);
    }
  });

  it("omits_player_gracefully", () => {
    const text = renderCommentary("GOAL", "en", { ...baseVars, player: undefined });
    expect(text).toContain("Goal for Portugal");
    expect(text).not.toMatch(/undefined/);
  });
});

describe("buildMomentId", () => {
  it("is_stable", () => {
    const input = {
      fixtureId: "18179763",
      eventType: "GOAL" as const,
      minute: 68,
      team: "home",
      player: "Ronaldo",
      scoreHome: 2,
      scoreAway: 1,
    };
    expect(buildMomentId(input)).toBe(buildMomentId(input));
  });
});
