import { describe, expect, it } from "vitest";
import { combineProbs, edgeOverConsensus } from "./combine.js";
import { consensusFromOdds, modelProbFromFeatures } from "./consensus.js";
import { EPSILON_NET } from "./config.js";

const ts = "2026-06-30T12:00:00Z";

const lines1x2 = [
  {
    fixtureId: "wc-1",
    market: "1X2",
    selection: "home",
    implied: 0.35,
    openImplied: 0.32,
    ts,
  },
  {
    fixtureId: "wc-1",
    market: "1X2",
    selection: "draw",
    implied: 0.28,
    openImplied: 0.29,
    ts,
  },
  {
    fixtureId: "wc-1",
    market: "1X2",
    selection: "away",
    implied: 0.37,
    openImplied: 0.39,
    ts,
  },
];

describe("consensus", () => {
  it("shin_1x2_returns_pi_tx", () => {
    const c = consensusFromOdds(lines1x2, ts);
    expect(c).not.toBeNull();
    expect(c!.piTx).toBeGreaterThan(0);
    expect(c!.piTx).toBeLessThan(1);
    expect(c!.home + (c!.draw ?? 0) + c!.away).toBeCloseTo(1, 5);
  });

  it("model_momentum_adjusts_vs_base", () => {
    const consensus = consensusFromOdds(lines1x2, ts)!;
    const base = modelProbFromFeatures({
      homeScore: 0,
      awayScore: 0,
      selection: consensus.selection,
      baseImplied: consensus.piTx,
      lines: lines1x2,
      events: [],
    });
    const boosted = modelProbFromFeatures({
      homeScore: 2,
      awayScore: 0,
      selection: "home",
      baseImplied: consensus.home,
      lines: lines1x2,
      events: [{ minute: 70 }],
    });
    expect(boosted).not.toBe(base);
  });

  it("property_c_in_unit_interval", () => {
    const samples = [0.15, 0.25, 0.4, 0.55, 0.72];
    for (const piTx of samples) {
      for (const piModel of samples) {
        const c = combineProbs({ piTx, piModel, alpha: 1, beta: 1 });
        expect(c).toBeGreaterThan(0);
        expect(c).toBeLessThan(1);
        const edge = edgeOverConsensus(c, piTx);
        expect(edge).toBeCloseTo(c - piTx, 8);
      }
    }
  });

  it("epsilon_net_pre_registered", () => {
    expect(EPSILON_NET).toBe(0.03);
  });
});
