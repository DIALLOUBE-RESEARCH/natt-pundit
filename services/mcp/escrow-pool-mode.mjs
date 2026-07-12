/**
 * F75N — Pool mode pure fn (mirror of packages/natt-core/src/escrow_pool_mode.ts).
 */

export function fundedSideCount(sideTotals) {
  return sideTotals.filter((x) => BigInt(x) > 0n).length;
}

export function deriveEscrowPoolMode(sideTotals) {
  return fundedSideCount(sideTotals) <= 1 ? "unmatched" : "parimutuel";
}

export function isUnmatchedPool(sideTotals) {
  return deriveEscrowPoolMode(sideTotals) === "unmatched";
}

export function canRefundUnmatched(input) {
  if (BigInt(input.positionAmount || 0) <= 0n || input.positionClaimed) return false;
  if (input.poolSettled) return false;
  if (!isUnmatchedPool(input.sideTotals)) return false;
  return input.nowSec >= input.kickoffTs;
}

export function canRefundAllVoid(input) {
  if (BigInt(input.positionAmount || 0) <= 0n || input.positionClaimed) return false;
  if (!input.poolSettled) return false;
  if (isUnmatchedPool(input.sideTotals)) return false;
  if (input.winningSide > 2) return false;
  return BigInt(input.sideTotals[input.winningSide] || 0) === 0n;
}
