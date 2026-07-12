import type { EscrowOutcome, Fixture } from "@natt-pundit/contracts";
import { deriveEscrowPoolMode } from "@natt-pundit/natt-core/escrow_pool_mode";
import type { EscrowActivityView, PoolSnapshot, UserPositionView } from "@/lib/nattEscrow";

export type BetLedgerStatus =
  | "open"
  | "claimable"
  | "won"
  | "lost"
  | "refund_eligible"
  | "refunded"
  | "void";

export type WalletBetRow = {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  side: EscrowOutcome;
  stakeUsdc: number;
  status: BetLedgerStatus;
  /** Net profit/loss (payout − stake). */
  pnlUsdc: number | null;
  /** Gross return if won/claimable/refund (what hits the wallet). */
  estimatedPayoutUsdc: number | null;
  claimed: boolean;
  poolSettled: boolean;
};

export type WalletPortfolioSummary = {
  openCount: number;
  settledCount: number;
  totalStakedUsdc: number;
  realizedPnlUsdc: number;
  unrealizedPnlUsdc: number;
  wonCount: number;
  lostCount: number;
};

function sideToIndex(side: EscrowOutcome): 0 | 1 | 2 {
  if (side === "home") return 0;
  if (side === "draw") return 1;
  return 2;
}

function usdcFromBase(base: bigint): number {
  return Number(base) / 1_000_000;
}

export function estimateParimutuelPayoutUsdc(
  pool: PoolSnapshot,
  side: EscrowOutcome,
  stakeUsdc: number,
): number | null {
  const idx = sideToIndex(side);
  const sideTotal = pool.sideTotals[idx];
  if (sideTotal <= BigInt(0)) return null;
  let poolTotal = pool.totalDeposited;
  const sideSum = pool.sideTotals[0] + pool.sideTotals[1] + pool.sideTotals[2];
  if (poolTotal <= BigInt(0) && sideSum > BigInt(0)) {
    poolTotal = sideSum;
  }
  if (poolTotal <= BigInt(0)) return null;
  const stakeBase = BigInt(Math.round(stakeUsdc * 1_000_000));
  const payoutBase = (stakeBase * poolTotal) / sideTotal;
  return usdcFromBase(payoutBase);
}

export function classifyWalletBet(input: {
  pool: PoolSnapshot;
  position: UserPositionView;
  nowSec?: number;
}): Pick<WalletBetRow, "status" | "pnlUsdc" | "estimatedPayoutUsdc"> {
  const { pool, position } = input;
  const nowSec = input.nowSec ?? Math.floor(Date.now() / 1000);
  const stake = position.amountUsdc;
  const side = position.side;
  if (!side || stake <= 0) {
    return { status: "void", pnlUsdc: null, estimatedPayoutUsdc: null };
  }

  const mode = deriveEscrowPoolMode(pool.sideTotals);
  const sideIdx = sideToIndex(side);
  const onWinningSide = pool.settled && pool.winningSide < 3 && pool.winningSide === sideIdx;

  if (mode === "unmatched" && !pool.settled && nowSec >= pool.kickoffTs) {
    return {
      status: position.claimed ? "refunded" : "refund_eligible",
      pnlUsdc: position.claimed ? 0 : null,
      estimatedPayoutUsdc: stake,
    };
  }

  if (!pool.settled) {
    return { status: "open", pnlUsdc: null, estimatedPayoutUsdc: null };
  }

  if (mode === "unmatched" || pool.winningSide > 2) {
    return {
      status: position.claimed ? "refunded" : "refund_eligible",
      pnlUsdc: position.claimed ? 0 : null,
      estimatedPayoutUsdc: stake,
    };
  }

  if (onWinningSide) {
    const payout = estimateParimutuelPayoutUsdc(pool, side, stake);
    const pnl = payout !== null ? payout - stake : null;
    if (position.claimed) {
      return { status: "won", pnlUsdc: pnl, estimatedPayoutUsdc: payout };
    }
    return { status: "claimable", pnlUsdc: pnl, estimatedPayoutUsdc: payout };
  }

  return { status: "lost", pnlUsdc: -stake, estimatedPayoutUsdc: 0 };
}

export function betRowFromActivity(
  fixture: Fixture,
  activity: EscrowActivityView,
  nowSec?: number,
): WalletBetRow | null {
  const pos = activity.yourPosition;
  if (!pos?.side) return null;
  if (!pos.exists && !pos.claimed) return null;
  if (pos.amountUsdc <= 0 && !pos.claimed) return null;
  const classified = classifyWalletBet({
    pool: activity.pool,
    position: pos,
    nowSec,
  });
  return {
    fixtureId: fixture.fixtureId,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    kickoffAt: fixture.kickoffAt,
    side: pos.side,
    stakeUsdc: pos.amountUsdc,
    claimed: pos.claimed,
    poolSettled: activity.pool.settled,
    ...classified,
  };
}

export function summarizeWalletBets(rows: WalletBetRow[]): WalletPortfolioSummary {
  let openCount = 0;
  let settledCount = 0;
  let totalStakedUsdc = 0;
  let realizedPnlUsdc = 0;
  let unrealizedPnlUsdc = 0;
  let wonCount = 0;
  let lostCount = 0;

  for (const row of rows) {
    totalStakedUsdc += row.stakeUsdc;
    if (row.status === "open" || row.status === "claimable" || row.status === "refund_eligible") {
      openCount += 1;
      if (row.pnlUsdc !== null) unrealizedPnlUsdc += row.pnlUsdc;
    } else {
      settledCount += 1;
      if (row.pnlUsdc !== null) realizedPnlUsdc += row.pnlUsdc;
      if (row.status === "won" || row.status === "refunded") wonCount += 1;
      if (row.status === "lost") lostCount += 1;
    }
  }

  return {
    openCount,
    settledCount,
    totalStakedUsdc,
    realizedPnlUsdc,
    unrealizedPnlUsdc,
    wonCount,
    lostCount,
  };
}

/** Activity column: gross return for wins, net P&L otherwise. */
export function walletBetDisplayAmount(row: WalletBetRow): number | null {
  if (row.status === "won" || row.status === "claimable") {
    if (row.estimatedPayoutUsdc !== null) return row.estimatedPayoutUsdc;
  }
  if (row.status === "refunded" || row.status === "refund_eligible") {
    return row.estimatedPayoutUsdc ?? row.stakeUsdc;
  }
  return row.pnlUsdc;
}
