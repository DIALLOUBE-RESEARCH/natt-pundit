import { describe, expect, it } from "vitest";
import { combineProbs, edgeOverConsensus, invLogit, logit } from "./combine.js";

describe("combine", () => {
  it("logit_inv_logit_roundtrip", () => {
    const p = 0.42;
    expect(invLogit(logit(p))).toBeCloseTo(p, 6);
  });

  it("equal_weights_midpoint_bias", () => {
    const c = combineProbs({ piTx: 0.4, piModel: 0.6, alpha: 1, beta: 1 });
    expect(c).toBeGreaterThan(0.4);
    expect(c).toBeLessThan(0.6);
  });

  it("edge_over_consensus", () => {
    expect(edgeOverConsensus(0.55, 0.5)).toBeCloseTo(0.05, 6);
  });
});
