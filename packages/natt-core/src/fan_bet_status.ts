/**
 * F96N — Fan-facing bet ticket status (pure; mirrors agent escrow state without infra labels).
 */
import {
  canRefundAllVoid,
  canRefundUnmatched,
  deriveEscrowPoolMode,
  type EscrowPoolMode,
  type SideTotals,
} from "./escrow_pool_mode.js";

export type FanBetStatus =
  | "needs_wallet"
  | "ready_to_bet"
  | "placing"
  | "ticket_open"
  | "live"
  | "settling"
  | "collect_available"
  | "won_paid"
  | "lost"
  | "refund_available"
  | "done";

export type FanBetStatusInput = {
  hasWallet: boolean;
  placing: boolean;
  poolExists: boolean;
  poolSettled: boolean;
  winningSide: number;
  sideTotals: SideTotals;
  kickoffTs: number;
  nowSec: number;
  fixtureStatus: "scheduled" | "live" | "finished";
  beforeKickoff: boolean;
  positionExists: boolean;
  positionAmountBase: bigint;
  positionClaimed: boolean;
  userOnWinningSide: boolean;
  keeperEnabled: boolean;
};

export function mapFanBetStatus(input: FanBetStatusInput): FanBetStatus {
  if (!input.hasWallet) return "needs_wallet";
  if (input.placing) return "placing";

  const poolMode = deriveEscrowPoolMode(input.sideTotals);
  const hasStake = input.positionExists && input.positionAmountBase > 0n;

  if (!hasStake) {
    if (input.beforeKickoff && input.fixtureStatus !== "finished") return "ready_to_bet";
    return "done";
  }

  if (input.positionClaimed) return "won_paid";

  if (
    canRefundUnmatched({
      sideTotals: input.sideTotals,
      kickoffTs: input.kickoffTs,
      nowSec: input.nowSec,
      poolSettled: input.poolSettled,
      positionAmount: input.positionAmountBase,
      positionClaimed: input.positionClaimed,
    })
  ) {
    return "refund_available";
  }

  if (input.fixtureStatus === "live") return "live";

  if (input.fixtureStatus !== "finished") {
    return "ticket_open";
  }

  if (
    canRefundAllVoid({
      sideTotals: input.sideTotals,
      poolSettled: input.poolSettled,
      winningSide: input.winningSide,
      positionAmount: input.positionAmountBase,
      positionClaimed: input.positionClaimed,
    })
  ) {
    return "refund_available";
  }

  if (!input.poolSettled) {
    if (poolMode === "unmatched") return "refund_available";
    if (input.keeperEnabled) return "settling";
    return "collect_available";
  }

  if (input.userOnWinningSide) return "collect_available";
  return "lost";
}

export function fanPoolModeLabel(mode: EscrowPoolMode): "parimutuel" | "unmatched" {
  return mode;
}
