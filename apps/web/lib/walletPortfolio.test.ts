import { describe, expect, it } from "vitest";
import {
  classifyWalletBet,
  estimateParimutuelPayoutUsdc,
  summarizeWalletBets,
  walletBetDisplayAmount,
  type WalletBetRow,
} from "./walletPortfolio";

const POOL_1V1_SETTLED = {
  exists: true,
  settled: true,
  winningSide: 0,
  totalDeposited: BigInt(0),
  sideTotals: [BigInt(1_000_000), BigInt(1_000_000), BigInt(0)] as [bigint, bigint, bigint],
  kickoffTs: 1_700_000_000,
};

describe("walletPortfolio", () => {
  it("parimutuel payout uses side totals when vault is empty after claim", () => {
    const payout = estimateParimutuelPayoutUsdc(POOL_1V1_SETTLED, "home", 1);
    expect(payout).toBe(2);
  });

  it("won claimed row: payout 2 USDC, net pnl +1", () => {
    const row = classifyWalletBet({
      pool: POOL_1V1_SETTLED,
      position: { exists: true, side: "home", amountUsdc: 1, claimed: true },
    });
    expect(row.status).toBe("won");
    expect(row.estimatedPayoutUsdc).toBe(2);
    expect(row.pnlUsdc).toBe(1);
    expect(walletBetDisplayAmount({ ...baseRow(), ...row })).toBe(2);
  });

  it("lost row shows negative stake", () => {
    const row = classifyWalletBet({
      pool: POOL_1V1_SETTLED,
      position: { exists: true, side: "away", amountUsdc: 1, claimed: false },
    });
    expect(row.status).toBe("lost");
    expect(row.pnlUsdc).toBe(-1);
    expect(walletBetDisplayAmount({ ...baseRow(), ...row })).toBe(-1);
  });

  it("summary nets win and loss", () => {
    const win: WalletBetRow = {
      ...baseRow(),
      fixtureId: "a",
      status: "won",
      stakeUsdc: 1,
      pnlUsdc: 1,
      estimatedPayoutUsdc: 2,
      poolSettled: true,
      claimed: true,
    };
    const loss: WalletBetRow = {
      ...baseRow(),
      fixtureId: "b",
      status: "lost",
      stakeUsdc: 1,
      pnlUsdc: -1,
      estimatedPayoutUsdc: 0,
      poolSettled: true,
      claimed: false,
    };
    const s = summarizeWalletBets([win, loss]);
    expect(s.realizedPnlUsdc).toBe(0);
    expect(s.wonCount).toBe(1);
    expect(s.lostCount).toBe(1);
  });
});

function baseRow(): WalletBetRow {
  return {
    fixtureId: "x",
    homeTeam: "A",
    awayTeam: "B",
    kickoffAt: "2026-07-10T20:00:00Z",
    side: "home",
    stakeUsdc: 1,
    status: "open",
    pnlUsdc: null,
    estimatedPayoutUsdc: null,
    claimed: false,
    poolSettled: false,
  };
}
