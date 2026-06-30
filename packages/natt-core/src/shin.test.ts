import { describe, expect, it } from "vitest";
import { shinDevig } from "./shin.js";

describe("shin", () => {
  it("devig_two_outcome_sums_to_one", () => {
    const fair = shinDevig([0.55, 0.55]);
    expect(fair.length).toBe(2);
    const sum = fair[0]! + fair[1]!;
    expect(sum).toBeCloseTo(1, 5);
    expect(fair[0]!).toBeCloseTo(0.5, 2);
  });

  it("devig_three_outcome_sums_to_one", () => {
    const fair = shinDevig([0.45, 0.28, 0.38]);
    expect(fair.length).toBe(3);
    const sum = fair.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("already_fair_probs_normalized", () => {
    const fair = shinDevig([0.5, 0.3, 0.2]);
    const sum = fair.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
