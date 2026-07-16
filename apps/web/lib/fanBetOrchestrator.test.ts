import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectedWallet } from "./solanaWallet";

const flags = vi.hoisted(() => ({ keeperEnabled: false }));

const createPool = vi.fn();
const depositUsdc = vi.fn();
const fetchPoolSnapshot = vi.fn();
const fetchEscrowActivity = vi.fn();
const claimWinnings = vi.fn();
const settlePool = vi.fn();
const refundUnmatched = vi.fn();
const refundAllVoid = vi.fn();
const fetchCpiArgs = vi.fn();
const fetchGatewayFixture = vi.fn();
const fetchMatchScores = vi.fn();
const fetchSettlementProof = vi.fn();

vi.mock("./fanUiFlag", () => ({
  fanBetUxEnabled: true,
  get escrowKeeperEnabled() {
    return flags.keeperEnabled;
  },
}));

vi.mock("./nattEscrow", () => ({
  createPool: (...args: unknown[]) => createPool(...args),
  depositUsdc: (...args: unknown[]) => depositUsdc(...args),
  fetchPoolSnapshot: (...args: unknown[]) => fetchPoolSnapshot(...args),
  fetchEscrowActivity: (...args: unknown[]) => fetchEscrowActivity(...args),
  claimWinnings: (...args: unknown[]) => claimWinnings(...args),
  settlePool: (...args: unknown[]) => settlePool(...args),
  refundUnmatched: (...args: unknown[]) => refundUnmatched(...args),
  refundAllVoid: (...args: unknown[]) => refundAllVoid(...args),
}));

vi.mock("./api", () => ({
  fetchCpiArgs: (...args: unknown[]) => fetchCpiArgs(...args),
  fetchGatewayFixture: (...args: unknown[]) => fetchGatewayFixture(...args),
  fetchMatchScores: (...args: unknown[]) => fetchMatchScores(...args),
  fetchSettlementProof: (...args: unknown[]) => fetchSettlementProof(...args),
}));

import { collectFanPayout, placeFanBet } from "./fanBetOrchestrator";

const wallet = { address: "wallet1", signTransaction: vi.fn() } as unknown as ConnectedWallet;

const unsettledPool = {
  pool: {
    exists: true,
    settled: false,
    kickoffTs: 1_700_000_000,
    sideTotals: ["1000000", "0", "2000000"],
    winningSide: null,
  },
  yourPosition: { exists: true, amountUsdc: 1, claimed: false },
};

const settledClaimable = {
  pool: {
    exists: true,
    settled: true,
    kickoffTs: 1_700_000_000,
    sideTotals: ["1000000", "0", "2000000"],
    winningSide: 0,
  },
  yourPosition: { exists: true, amountUsdc: 1, claimed: false },
};

describe("placeFanBet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flags.keeperEnabled = false;
    depositUsdc.mockResolvedValue("dep-sig");
    createPool.mockResolvedValue("create-sig");
  });

  it("creates pool then deposits when pool missing", async () => {
    fetchPoolSnapshot.mockResolvedValue({ exists: false });
    const sig = await placeFanBet(wallet, "fx1", "2026-07-10T12:00:00.000Z", "home", 1);
    expect(createPool).toHaveBeenCalledWith(wallet, "fx1", "2026-07-10T12:00:00.000Z");
    expect(depositUsdc).toHaveBeenCalledWith(wallet, "fx1", 0, 1);
    expect(sig).toBe("dep-sig");
  });

  it("skips create when pool exists", async () => {
    fetchPoolSnapshot.mockResolvedValue({ exists: true });
    await placeFanBet(wallet, "fx1", "2026-07-10T12:00:00.000Z", "away", 2);
    expect(createPool).not.toHaveBeenCalled();
    expect(depositUsdc).toHaveBeenCalledWith(wallet, "fx1", 2, 2);
  });
});

describe("collectFanPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flags.keeperEnabled = false;
    refundUnmatched.mockResolvedValue(null);
    refundAllVoid.mockResolvedValue(null);
    claimWinnings.mockResolvedValue("claim-sig");
    settlePool.mockResolvedValue("settle-sig");
    fetchGatewayFixture.mockResolvedValue({ kickoffAt: "2026-06-15T18:00:00Z" });
    fetchMatchScores.mockResolvedValue({ score: { home: 2, away: 1 } });
    fetchSettlementProof.mockResolvedValue({ validated: true });
    fetchCpiArgs.mockResolvedValue({ proof: "mock" });
  });

  it("keeper ON: never calls settlePool when pool unsettled", async () => {
    flags.keeperEnabled = true;
    fetchEscrowActivity.mockResolvedValue(unsettledPool);

    await expect(
      collectFanPayout(wallet, "fx1", "2026-06-15T18:00:00Z"),
    ).rejects.toThrow("collect_not_available");

    expect(settlePool).not.toHaveBeenCalled();
    expect(fetchCpiArgs).not.toHaveBeenCalled();
    expect(claimWinnings).not.toHaveBeenCalled();
  });

  it("keeper ON: claim only when pool already settled", async () => {
    flags.keeperEnabled = true;
    fetchEscrowActivity.mockResolvedValue(settledClaimable);

    const sig = await collectFanPayout(wallet, "fx1", "2026-06-15T18:00:00Z");

    expect(sig).toBe("claim-sig");
    expect(settlePool).not.toHaveBeenCalled();
    expect(claimWinnings).toHaveBeenCalledWith(wallet, "fx1");
  });

  it("keeper OFF: settles then claims when pool unsettled", async () => {
    flags.keeperEnabled = false;
    fetchEscrowActivity
      .mockResolvedValueOnce(unsettledPool)
      .mockResolvedValueOnce(unsettledPool)
      .mockResolvedValueOnce(settledClaimable);

    const sig = await collectFanPayout(wallet, "fx1", "2026-06-15T18:00:00Z");

    expect(settlePool).toHaveBeenCalledWith(wallet, "fx1", { proof: "mock" });
    expect(claimWinnings).toHaveBeenCalledWith(wallet, "fx1");
    expect(sig).toBe("claim-sig");
  });
});
