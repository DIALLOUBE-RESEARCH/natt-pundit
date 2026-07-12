import type { EscrowOutcome, Fixture } from "@natt-pundit/contracts";
import {
  canRefundAllVoid,
  canRefundUnmatched,
} from "@natt-pundit/natt-core/escrow_pool_mode";
import { escrowOutcomeFromScore } from "@natt-pundit/natt-core/wcMatchRules";
import { fetchCpiArgs, fetchGatewayFixture, fetchMatchScores, fetchSettlementProof } from "@/lib/api";
import {
  claimWinnings,
  createPool,
  depositUsdc,
  fetchEscrowActivity,
  fetchPoolSnapshot,
  refundAllVoid,
  refundUnmatched,
  settlePool,
} from "@/lib/nattEscrow";
import type { ConnectedWallet } from "@/lib/solanaWallet";
import { resolveWcFormat } from "@/lib/wcMatchRules";
import type { WalletBetRow } from "@/lib/walletPortfolio";

export type FanPostMatchAction = "collect" | "refund";

function sideToNum(o: EscrowOutcome): 0 | 1 | 2 {
  if (o === "home") return 0;
  if (o === "draw") return 1;
  return 2;
}

/** One CTA pre-match: create pool if needed, then deposit. */
export async function placeFanBet(
  wallet: ConnectedWallet,
  fixtureId: string,
  kickoffAt: string,
  side: EscrowOutcome,
  amountUsdc: number,
): Promise<string> {
  const snap = await fetchPoolSnapshot(fixtureId);
  if (!snap?.exists) {
    await createPool(wallet, fixtureId, kickoffAt);
  }
  return depositUsdc(wallet, fixtureId, sideToNum(side), amountUsdc);
}

async function resolveSettleOutcomeForFixture(
  fixtureId: string,
  kickoffAt: string,
): Promise<NonNullable<ReturnType<typeof escrowOutcomeFromScore>>> {
  let fixture: Fixture | null = null;
  try {
    fixture = await fetchGatewayFixture(fixtureId);
  } catch {
    /* optional */
  }
  const scores = await fetchMatchScores(fixtureId);
  const score = scores.score ?? fixture?.score;
  if (!score) throw new Error("scores_unavailable");
  const wcFormat = fixture ? resolveWcFormat(fixture) : resolveWcFormat({ kickoffAt });
  const outcome = escrowOutcomeFromScore(score, wcFormat, scores.penScore);
  if (!outcome) throw new Error("outcome_unavailable");
  return outcome;
}

async function ensureSettlementProof(
  fixtureId: string,
  outcome: ReturnType<typeof escrowOutcomeFromScore>,
): Promise<void> {
  try {
    const proof = await fetchSettlementProof(fixtureId);
    if (proof.validated) return;
  } catch {
    /* CPI fallback */
  }
  if (!outcome) throw new Error("proof_unavailable");
  await fetchCpiArgs(fixtureId, outcome);
}

async function settleIfNeeded(wallet: ConnectedWallet, fixtureId: string, kickoffAt: string): Promise<void> {
  const act = await fetchEscrowActivity(fixtureId, wallet.address);
  if (!act?.pool.exists || act.pool.settled) return;
  const outcome = await resolveSettleOutcomeForFixture(fixtureId, kickoffAt);
  await ensureSettlementProof(fixtureId, outcome);
  const args = await fetchCpiArgs(fixtureId, outcome);
  await settlePool(wallet, fixtureId, args);
}

async function refundIfEligible(wallet: ConnectedWallet, fixtureId: string): Promise<string | null> {
  const act = await fetchEscrowActivity(fixtureId, wallet.address);
  if (!act?.yourPosition) return null;
  const pool = act.pool;
  const pos = act.yourPosition;
  const nowSec = Math.floor(Date.now() / 1000);
  const amountBase = pos.exists ? BigInt(Math.round(pos.amountUsdc * 1_000_000)) : BigInt(0);

  if (
    canRefundUnmatched({
      sideTotals: pool.sideTotals,
      kickoffTs: pool.kickoffTs,
      nowSec,
      poolSettled: pool.settled,
      positionAmount: amountBase,
      positionClaimed: pos.claimed,
    })
  ) {
    return refundUnmatched(wallet, fixtureId);
  }

  if (
    canRefundAllVoid({
      sideTotals: pool.sideTotals,
      poolSettled: pool.settled,
      winningSide: pool.winningSide,
      positionAmount: amountBase,
      positionClaimed: pos.claimed,
    })
  ) {
    return refundAllVoid(wallet, fixtureId);
  }
  return null;
}

/** Fan « Encaisser » — refund, or settle+claim, or claim only. */
export async function collectFanPayout(
  wallet: ConnectedWallet,
  fixtureId: string,
  kickoffAt: string,
): Promise<string> {
  const refundSig = await refundIfEligible(wallet, fixtureId);
  if (refundSig) return refundSig;

  await settleIfNeeded(wallet, fixtureId, kickoffAt);

  const act = await fetchEscrowActivity(fixtureId, wallet.address);
  if (act?.pool.settled && act.yourPosition?.exists && !act.yourPosition.claimed) {
    return claimWinnings(wallet, fixtureId);
  }

  throw new Error("collect_not_available");
}

export type WalletBetEscrowAction = "collect" | "refund";

export function walletBetEscrowAction(bet: WalletBetRow): WalletBetEscrowAction | null {
  if (bet.status === "claimable") return "collect";
  if (bet.status === "refund_eligible") return "refund";
  if (bet.status === "open" && !bet.poolSettled) {
    const kickoffMs = Date.parse(bet.kickoffAt);
    if (Number.isFinite(kickoffMs) && Date.now() >= kickoffMs) return "collect";
  }
  return null;
}

export async function runWalletBetEscrow(
  wallet: ConnectedWallet,
  bet: WalletBetRow,
  action: WalletBetEscrowAction,
): Promise<string> {
  if (action === "refund") {
    const sig = await refundIfEligible(wallet, bet.fixtureId);
    if (!sig) throw new Error("refund_not_eligible");
    return sig;
  }
  return collectFanPayout(wallet, bet.fixtureId, bet.kickoffAt);
}
