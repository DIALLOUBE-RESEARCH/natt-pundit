import { describe, expect, it } from "vitest";
import {
  canRefundAllVoid,
  canRefundUnmatched,
  deriveEscrowPoolMode,
  fundedSideCount,
  isUnmatchedPool,
} from "./escrow_pool_mode.js";

describe("escrow_pool_mode", () => {
  it("fundedSideCount", () => {
    expect(fundedSideCount([1_000_000n, 0n, 0n])).toBe(1);
    expect(fundedSideCount([1n, 2n, 0n])).toBe(2);
    expect(fundedSideCount([0n, 0n, 0n])).toBe(0);
  });

  it("deriveEscrowPoolMode", () => {
    expect(deriveEscrowPoolMode([1_000_000n, 0n, 0n])).toBe("unmatched");
    expect(deriveEscrowPoolMode([0n, 0n, 0n])).toBe("unmatched");
    expect(deriveEscrowPoolMode([1n, 1n, 0n])).toBe("parimutuel");
    expect(deriveEscrowPoolMode([1n, 0n, 1n])).toBe("parimutuel");
  });

  it("canRefundUnmatched after kickoff", () => {
    expect(
      canRefundUnmatched({
        sideTotals: [1_000_000n, 0n, 0n],
        kickoffTs: 1000,
        nowSec: 1000,
        poolSettled: false,
        positionAmount: 1_000_000n,
        positionClaimed: false,
      }),
    ).toBe(true);
    expect(
      canRefundUnmatched({
        sideTotals: [1_000_000n, 0n, 0n],
        kickoffTs: 1000,
        nowSec: 999,
        poolSettled: false,
        positionAmount: 1_000_000n,
        positionClaimed: false,
      }),
    ).toBe(false);
    expect(
      canRefundUnmatched({
        sideTotals: [1n, 1n, 0n],
        kickoffTs: 1000,
        nowSec: 2000,
        poolSettled: false,
        positionAmount: 1n,
        positionClaimed: false,
      }),
    ).toBe(false);
  });

  it("canRefundAllVoid when winning issue unfunded", () => {
    expect(
      canRefundAllVoid({
        sideTotals: [1_000_000n, 0n, 1_000_000n],
        poolSettled: true,
        winningSide: 1,
        positionAmount: 1_000_000n,
        positionClaimed: false,
      }),
    ).toBe(true);
    expect(
      canRefundAllVoid({
        sideTotals: [1_000_000n, 0n, 1_000_000n],
        poolSettled: true,
        winningSide: 0,
        positionAmount: 1_000_000n,
        positionClaimed: false,
      }),
    ).toBe(false);
  });

  it("isUnmatchedPool mirrors mode", () => {
    expect(isUnmatchedPool([5n, 0n, 0n])).toBe(true);
    expect(isUnmatchedPool([5n, 3n, 0n])).toBe(false);
  });
});
