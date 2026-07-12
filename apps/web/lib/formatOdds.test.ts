import { describe, expect, it } from "vitest";
import { pick1x2Lines } from "@/lib/formatOdds";
import type { OddsLine } from "@natt-pundit/contracts";

function line(selection: string, implied: number, market = "1X2"): OddsLine {
  return {
    fixtureId: "1",
    market,
    selection,
    implied,
    ts: "2026-07-01T00:00:00.000Z",
  };
}

describe("pick1x2Lines", () => {
  it("keeps only 1X2 home/draw/away", () => {
    const odds = [
      line("home", 0.5),
      line("draw", 0.25),
      line("away", 0.25),
      line("home", 0.9, "OU"),
    ];
    const snap = pick1x2Lines(odds);
    expect(snap.home?.implied).toBe(0.5);
    expect(snap.draw?.implied).toBe(0.25);
    expect(snap.away?.implied).toBe(0.25);
  });

  it("returns empty snapshot when no 1X2 lines", () => {
    const snap = pick1x2Lines([line("home", 0.5, "AH")]);
    expect(snap.home).toBeUndefined();
    expect(snap.draw).toBeUndefined();
    expect(snap.away).toBeUndefined();
  });
});
