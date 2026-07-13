import { describe, expect, it } from "vitest";
import { mapFanBetStatus } from "./fan_bet_status.js";

const base = {
  hasWallet: true,
  placing: false,
  poolExists: true,
  poolSettled: false,
  winningSide: 3,
  sideTotals: [10000n, 0n, 10000n] as const,
  kickoffTs: 1_700_000_000,
  nowSec: 1_700_000_100,
  fixtureStatus: "scheduled" as const,
  beforeKickoff: true,
  positionExists: false,
  positionAmountBase: 0n,
  positionClaimed: false,
  userOnWinningSide: false,
  keeperEnabled: false,
};

describe("mapFanBetStatus", () => {
  it("needs_wallet without wallet", () => {
    expect(mapFanBetStatus({ ...base, hasWallet: false })).toBe("needs_wallet");
  });

  it("ready_to_bet before kickoff without position", () => {
    expect(mapFanBetStatus(base)).toBe("ready_to_bet");
  });

  it("ticket_open with open position pre-finish", () => {
    expect(
      mapFanBetStatus({
        ...base,
        positionExists: true,
        positionAmountBase: 10000n,
        fixtureStatus: "scheduled",
        beforeKickoff: false,
        nowSec: base.kickoffTs + 60,
      }),
    ).toBe("ticket_open");
  });

  it("collect_available when finished unsettled parimutuel", () => {
    expect(
      mapFanBetStatus({
        ...base,
        positionExists: true,
        positionAmountBase: 10000n,
        fixtureStatus: "finished",
        beforeKickoff: false,
        poolSettled: false,
      }),
    ).toBe("collect_available");
  });

  it("settling when keeper on and unsettled", () => {
    expect(
      mapFanBetStatus({
        ...base,
        keeperEnabled: true,
        positionExists: true,
        positionAmountBase: 10000n,
        fixtureStatus: "finished",
        beforeKickoff: false,
        poolSettled: false,
      }),
    ).toBe("settling");
  });

  it("collect_available when keeper settled pool for winner", () => {
    expect(
      mapFanBetStatus({
        ...base,
        keeperEnabled: true,
        positionExists: true,
        positionAmountBase: 10000n,
        fixtureStatus: "finished",
        beforeKickoff: false,
        poolSettled: true,
        winningSide: 0,
        userOnWinningSide: true,
      }),
    ).toBe("collect_available");
  });

  it("lost when settled on losing side", () => {
    expect(
      mapFanBetStatus({
        ...base,
        positionExists: true,
        positionAmountBase: 10000n,
        fixtureStatus: "finished",
        poolSettled: true,
        winningSide: 2,
        userOnWinningSide: false,
      }),
    ).toBe("lost");
  });
});
