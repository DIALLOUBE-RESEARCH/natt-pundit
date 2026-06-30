import { describe, expect, it } from "vitest";
import { mapOdds, type TxlineOddsRow } from "./txlineMap.js";

describe("txlineMap", () => {
  it("maps_fulltime_1x2_pct", () => {
    const rows: TxlineOddsRow[] = [
      {
        FixtureId: 1,
        Ts: Date.now(),
        SuperOddsType: "1X2_PARTICIPANT_RESULT",
        MarketPeriod: null,
        PriceNames: ["part1", "draw", "part2"],
        Prices: [3.5, 3.2, 2.1],
        Pct: ["27.174%", "27.933%", "44.903%"],
      },
    ];
    const out = mapOdds("1", rows);
    expect(out).toHaveLength(3);
    expect(out[0]!.implied).toBeCloseTo(0.27174, 4);
  });

  it("falls_back_to_prices_when_pct_empty", () => {
    const rows: TxlineOddsRow[] = [
      {
        FixtureId: 2,
        Ts: Date.now(),
        SuperOddsType: "1x2_participant_result",
        MarketPeriod: "",
        PriceNames: ["part1", "part2"],
        Prices: [2.0, 2.0],
        Pct: ["", ""],
      },
    ];
    const out = mapOdds("2", rows);
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out[0]!.implied).toBeCloseTo(0.5, 4);
  });

  it("returns_empty_when_no_implied_data", () => {
    const rows: TxlineOddsRow[] = [
      {
        FixtureId: 3,
        Ts: Date.now(),
        SuperOddsType: "UNKNOWN",
        MarketPeriod: "1H",
        PriceNames: ["x"],
        Prices: [1],
        Pct: [""],
      },
    ];
    expect(mapOdds("3", rows)).toEqual([]);
  });
});
