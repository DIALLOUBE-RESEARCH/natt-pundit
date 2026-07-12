import { describe, expect, it } from "vitest";
import { filterOddsForWcFormat, resolveWcFormat } from "@/lib/wcMatchRules";
import type { OddsLine } from "@natt-pundit/contracts";

describe("resolveWcFormat", () => {
  it("uses kickoff when wcFormat missing — Jul 9 2026 is knockout", () => {
    expect(
      resolveWcFormat({
        kickoffAt: "2026-07-09T20:00:00.000Z",
      }),
    ).toBe("knockout");
  });

  it("group stage before 28 Jun 2026", () => {
    expect(
      resolveWcFormat({
        kickoffAt: "2026-06-20T18:00:00.000Z",
      }),
    ).toBe("group");
  });
});

describe("filterOddsForWcFormat", () => {
  const drawLine: OddsLine = {
    fixtureId: "1",
    market: "1X2",
    selection: "draw",
    implied: 0.25,
    ts: "2026-07-01T00:00:00.000Z",
  };
  const homeLine: OddsLine = {
    fixtureId: "1",
    market: "1X2",
    selection: "home",
    implied: 0.5,
    ts: "2026-07-01T00:00:00.000Z",
  };

  it("drops draw in knockout", () => {
    const out = filterOddsForWcFormat([homeLine, drawLine], "knockout");
    expect(out).toHaveLength(1);
    expect(out[0].selection).toBe("home");
  });

  it("keeps draw in group", () => {
    expect(filterOddsForWcFormat([homeLine, drawLine], "group")).toHaveLength(2);
  });
});
