import { describe, expect, it } from "vitest";
import { toPublicEdgeVerdict } from "./redact.js";

describe("redact F86N", () => {
  it("drops pi_model c edge_score from public verdict", () => {
    const pub = toPublicEdgeVerdict({
      fixtureId: "wc-1",
      verdict: "SETUP",
      edge_score: 0.05,
      why: "internal",
      ts: "2026-01-01T00:00:00Z",
      direction: "home",
      pi_tx: 0.4,
      pi_model: 0.5,
      c: 0.45,
      epsilon_net: 0.03,
    });
    expect(pub.conviction).toBe("medium");
    expect(pub.why).toContain("home");
    expect(pub.why).toContain("medium");
    expect(pub).not.toHaveProperty("pi_model");
    expect(pub).not.toHaveProperty("c");
    expect(pub).not.toHaveProperty("edge_score");
  });
});
