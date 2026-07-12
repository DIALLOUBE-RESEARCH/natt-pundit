/**
 * F75N — Pure pool mode from side liquidity (mirrors on-chain natt_escrow).
 */

export type EscrowPoolMode = "unmatched" | "parimutuel";

export type SideTotals = readonly [bigint, bigint, bigint] | [bigint, bigint, bigint];

export function fundedSideCount(sideTotals: SideTotals): number {
  return sideTotals.filter((x) => x > 0n).length;
}

/** UNMATCHED when at most one 1X2 issue has deposits (no parimutuel counterparty). */
export function deriveEscrowPoolMode(sideTotals: SideTotals): EscrowPoolMode {
  return fundedSideCount(sideTotals) <= 1 ? "unmatched" : "parimutuel";
}

export function isUnmatchedPool(sideTotals: SideTotals): boolean {
  return deriveEscrowPoolMode(sideTotals) === "unmatched";
}

export function canRefundUnmatched(input: {
  sideTotals: SideTotals;
  kickoffTs: number;
  nowSec: number;
  poolSettled: boolean;
  positionAmount: bigint;
  positionClaimed: boolean;
}): boolean {
  if (input.positionAmount <= 0n || input.positionClaimed) return false;
  if (input.poolSettled) return false;
  if (!isUnmatchedPool(input.sideTotals)) return false;
  return input.nowSec >= input.kickoffTs;
}

export function canRefundAllVoid(input: {
  sideTotals: SideTotals;
  poolSettled: boolean;
  winningSide: number;
  positionAmount: bigint;
  positionClaimed: boolean;
}): boolean {
  if (input.positionAmount <= 0n || input.positionClaimed) return false;
  if (!input.poolSettled) return false;
  if (isUnmatchedPool(input.sideTotals)) return false;
  if (input.winningSide > 2) return false;
  return input.sideTotals[input.winningSide] === 0n;
}

export function canSettleParimutuel(sideTotals: SideTotals): boolean {
  return !isUnmatchedPool(sideTotals);
}
