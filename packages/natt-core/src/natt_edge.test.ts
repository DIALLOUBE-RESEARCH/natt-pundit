import { describe, expect, it } from "vitest";
import { EPSILON_NET } from "./config.js";
import { computeEdgeVerdict } from "./natt_edge.js";

const ts = "2026-06-24T12:00:00Z";

describe("natt_edge", () => {
  it("hold_when_no_odds", () => {
    const v = computeEdgeVerdict({
      fixtureId: "wc-1",
      lines: [],
      ts,
    });
    expect(v.verdict).toBe("HOLD");
    expect(v.pi_tx).toBe(0);
  });

  it("hold_when_edge_below_epsilon", () => {
    const v = computeEdgeVerdict({
      fixtureId: "wc-1",
      lines: [
        {
          fixtureId: "wc-1",
          market: "1x2",
          selection: "home",
          implied: 0.5,
          ts,
        },
        {
          fixtureId: "wc-1",
          market: "1x2",
          selection: "away",
          implied: 0.5,
          ts,
        },
      ],
      homeScore: 0,
      awayScore: 0,
      ts,
      epsilonNet: 0.5,
    });
    expect(v.verdict).toBe("HOLD");
    expect(v.edge_score).toBeLessThanOrEqual(0.5);
  });

  it("setup_when_edge_above_epsilon", () => {
    const v = computeEdgeVerdict({
      fixtureId: "wc-1",
      lines: [
        {
          fixtureId: "wc-1",
          market: "1x2",
          selection: "home",
          implied: 0.35,
          ts,
        },
        {
          fixtureId: "wc-1",
          market: "1x2",
          selection: "away",
          implied: 0.35,
          ts,
        },
      ],
      homeScore: 2,
      awayScore: 0,
      ts,
      epsilonNet: 0.001,
    });
    expect(v.verdict).toBe("SETUP");
    expect(v.edge_score).toBeGreaterThan(EPSILON_NET);
    expect(v.c).toBeGreaterThan(v.pi_tx);
  });
});
