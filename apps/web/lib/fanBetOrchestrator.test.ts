import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectedWallet } from "./solanaWallet";

const createPool = vi.fn();
const depositUsdc = vi.fn();
const fetchPoolSnapshot = vi.fn();

vi.mock("./nattEscrow", () => ({
  createPool: (...args: unknown[]) => createPool(...args),
  depositUsdc: (...args: unknown[]) => depositUsdc(...args),
  fetchPoolSnapshot: (...args: unknown[]) => fetchPoolSnapshot(...args),
  fetchEscrowActivity: vi.fn(),
  claimWinnings: vi.fn(),
  settlePool: vi.fn(),
  refundUnmatched: vi.fn(),
  refundAllVoid: vi.fn(),
}));

vi.mock("./api", () => ({
  fetchCpiArgs: vi.fn(),
  fetchGatewayFixture: vi.fn(),
  fetchMatchScores: vi.fn(),
  fetchSettlementProof: vi.fn(),
}));

import { placeFanBet } from "./fanBetOrchestrator";

const wallet = { address: "wallet1", signTransaction: vi.fn() } as unknown as ConnectedWallet;

describe("placeFanBet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
