import { describe, expect, it } from "vitest";
import { holdPillValue, publicEdgeSummaryText, setupPillValue } from "./edgePublicI18n";

describe("edgePublicI18n", () => {
  it("setup pill uses real direction and conviction", () => {
    const label = setupPillValue(
      { direction: "away", conviction: "medium" },
      "Norway",
      "England",
      "en",
    );
    expect(label).toContain("England");
    expect(label).toContain("medium");
    expect(label).not.toContain("1.000");
  });

  it("hold pill is not a fake zero score", () => {
    expect(holdPillValue("en")).toBe("No edge");
    expect(holdPillValue("fr")).toContain("edge");
  });

  it("summary names the team on SETUP", () => {
    const text = publicEdgeSummaryText(
      { verdict: "SETUP", direction: "away", conviction: "high" },
      "Norway",
      "England",
      "fr",
    );
    expect(text).toContain("England");
    expect(text).toContain("forte");
  });
});
