import { describe, expect, it } from "vitest";
import { walletBetEscrowAction } from "./walletBetEscrow";
import type { WalletBetRow } from "./walletPortfolio";

function row(partial: Partial<WalletBetRow>): WalletBetRow {
  return {
    fixtureId: "18179549",
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    kickoffAt: "2026-07-04T01:30:00.000Z",
    side: "home",
    stakeUsdc: 1,
    status: "open",
    pnlUsdc: null,
    estimatedPayoutUsdc: null,
    claimed: false,
    poolSettled: false,
    ...partial,
  };
}

describe("walletBetEscrowAction", () => {
  it("claimable -> collect", () => {
    expect(walletBetEscrowAction(row({ status: "claimable", poolSettled: true }))).toBe("collect");
  });

  it("refund_eligible -> refund", () => {
    expect(walletBetEscrowAction(row({ status: "refund_eligible" }))).toBe("refund");
  });

  it("open after kickoff -> collect", () => {
    expect(
      walletBetEscrowAction(
        row({
          status: "open",
          poolSettled: false,
          kickoffAt: "2020-01-01T00:00:00.000Z",
        }),
      ),
    ).toBe("collect");
  });

  it("won claimed -> no action", () => {
    expect(walletBetEscrowAction(row({ status: "won", claimed: true, poolSettled: true }))).toBeNull();
  });

  it("open before kickoff -> no action", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(walletBetEscrowAction(row({ kickoffAt: future }))).toBeNull();
  });
});
