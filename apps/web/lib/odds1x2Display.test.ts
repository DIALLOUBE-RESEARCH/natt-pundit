import { describe, expect, it } from "vitest";
import { build1x2Entries } from "@/lib/odds1x2Display";
import type { OddsLine } from "@natt-pundit/contracts";

function line(selection: string, implied: number): OddsLine {
  return {
    fixtureId: "1",
    market: "1X2",
    selection,
    implied,
    ts: "2026-07-01T00:00:00.000Z",
  };
}

describe("build1x2Entries", () => {
  it("labels home/away with team shorts and marks unique favorite", () => {
    const entries = build1x2Entries(
      [line("home", 0.5), line("draw", 0.25), line("away", 0.1)],
      "France",
      "Morocco",
      "fr",
      "Nul",
      true,
    );
    expect(entries.map((e) => e.label)).toEqual(["France", "Nul", "Maroc"]);
    expect(entries.find((e) => e.key === "home")?.isFavorite).toBe(true);
    expect(entries.find((e) => e.key === "away")?.decimal).toBe("10.00");
  });

  it("skips draw when showDraw is false", () => {
    const entries = build1x2Entries(
      [line("home", 0.55), line("draw", 0.25), line("away", 0.2)],
      "France",
      "Morocco",
      "en",
      "Draw",
      false,
    );
    expect(entries).toHaveLength(2);
    expect(entries.some((e) => e.key === "draw")).toBe(false);
  });
});
