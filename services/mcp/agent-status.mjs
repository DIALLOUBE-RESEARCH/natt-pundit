/**
 * F73N + F75N + F87 — Pure agent next-step logic + fixture status aggregation.
 */
import { fetchMatchEdge, fetchClvVerdict, fetchScores } from "./pundit-client.mjs";
import {
  applyDepositPolicyToAction,
  applyWalletlessAgentView,
  deriveDepositPolicy,
  EMPTY_AGENT_POSITION,
} from "./agent-edge-policy.mjs";
import {
  canRefundAllVoid,
  canRefundUnmatched,
  deriveEscrowPoolMode,
} from "./escrow-pool-mode.mjs";
import {
  fetchEscrowPool,
  getEscrowProgramId,
  parseOptionalAgentWallet,
  positionPda,
  poolPda,
} from "./escrow-agent.mjs";
import { getEscrowConnection } from "./solana-rpc.mjs";

const SIDE_NAMES = ["home", "draw", "away"];
const WC26_GROUP_STAGE_END_MS = Date.parse("2026-06-27T23:59:59.999Z");

function wcMatchFormat(kickoffAt) {
  const ms = Date.parse(kickoffAt ?? "");
  if (!Number.isFinite(ms)) return "group";
  return ms <= WC26_GROUP_STAGE_END_MS ? "group" : "knockout";
}

function escrowOutcomeFromScore(score, format, penScore) {
  if (!score) return null;
  if (format === "knockout") {
    if (penScore && penScore.home !== penScore.away) {
      return penScore.home > penScore.away ? "home" : "away";
    }
    if (score.home !== score.away) {
      return score.home > score.away ? "home" : "away";
    }
    return null;
  }
  if (score.home > score.away) return "home";
  if (score.away > score.home) return "away";
  return "draw";
}

/**
 * @param {{
 *   fixtureStatus: string;
 *   poolExists: boolean;
 *   poolSettled: boolean;
 *   winningSide: number;
 *   sideTotals: string[];
 *   kickoffTs: number;
 *   nowSec: number;
 *   positionExists: boolean;
 *   positionAmount: bigint;
 *   positionSide: number | null;
 *   positionClaimed: boolean;
 *   matchWinnerOutcome: string | null;
 * }} input
 */
export function deriveAgentNextAction(input) {
  const {
    fixtureStatus,
    poolExists,
    poolSettled,
    winningSide,
    sideTotals,
    kickoffTs,
    nowSec,
    positionExists,
    positionAmount,
    positionSide,
    positionClaimed,
    matchWinnerOutcome,
  } = input;

  const base = {
    settleable: false,
    claimable: false,
    refundable: false,
    pool_mode: deriveEscrowPoolMode(sideTotals),
  };

  if (!poolExists) {
    return { ...base, next_action: "create_pool", detail: "Pool PDA not initialized on devnet." };
  }

  if (!positionExists || positionAmount === 0n) {
    if (fixtureStatus === "finished") {
      return { ...base, next_action: "none", reason: "match_finished_no_position" };
    }
    return { ...base, next_action: "deposit", detail: "Open position + deposit min 0.01 USDC." };
  }

  if (
    canRefundUnmatched({
      sideTotals,
      kickoffTs,
      nowSec,
      poolSettled,
      positionAmount: positionAmount.toString(),
      positionClaimed,
    })
  ) {
    return {
      ...base,
      next_action: "refund",
      refundable: true,
      detail: "Unmatched pool — full stake return via build_escrow_refund_tx (no settle).",
    };
  }

  if (fixtureStatus !== "finished") {
    return {
      ...base,
      next_action: "wait_match",
      detail: "Position open — wait until fixture status is finished or kickoff for unmatched refund.",
    };
  }

  if (
    canRefundAllVoid({
      sideTotals,
      poolSettled,
      winningSide,
      positionAmount: positionAmount.toString(),
      positionClaimed,
    })
  ) {
    return {
      ...base,
      next_action: "refund_all",
      refundable: true,
      detail: "Void winning issue — build_escrow_refund_all_tx for full refund.",
    };
  }

  if (!poolSettled) {
    if (base.pool_mode === "unmatched") {
      return {
        ...base,
        next_action: "refund",
        refundable: true,
        detail: "Unmatched pool after match — refund, not settle.",
      };
    }
    const suggested =
      matchWinnerOutcome && SIDE_NAMES.includes(matchWinnerOutcome)
        ? matchWinnerOutcome
        : positionSide !== null && positionSide <= 2
          ? SIDE_NAMES[positionSide]
          : "home";
    return {
      ...base,
      next_action: "settle",
      settleable: true,
      suggested_outcome: suggested,
      detail: "Match finished — call get_cpi_settle_args then build_escrow_settle_tx.",
    };
  }

  if (positionClaimed) {
    return { ...base, next_action: "done", detail: "Winnings already claimed." };
  }

  if (positionSide === winningSide) {
    return {
      ...base,
      next_action: "claim",
      claimable: true,
      detail: "Pool settled on your side — build_escrow_claim_tx then sign.",
    };
  }

  return {
    ...base,
    next_action: "done",
    reason: "lost",
    detail: "Pool settled — position was not on winning side.",
  };
}

export function parsePositionAccount(data) {
  if (!data || data.length < 82) {
    return { exists: false, side: null, amount: 0n, claimed: false };
  }
  const side = data[72];
  const amount = data.readBigUInt64LE(73);
  const claimed = data[81] !== 0;
  return {
    exists: true,
    side,
    side_name: side !== null && side <= 2 ? SIDE_NAMES[side] : null,
    amount,
    amount_usdc: Number(amount) / 1_000_000,
    claimed,
  };
}

export async function readAgentPosition(fixture_id, agent_wallet) {
  const user = parseOptionalAgentWallet(agent_wallet);
  if (!user) {
    return { ...EMPTY_AGENT_POSITION };
  }
  const programId = getEscrowProgramId();
  const connection = await getEscrowConnection();
  const pool = poolPda(programId, fixture_id);
  const positionKey = positionPda(programId, pool, user);
  const info = await connection.getAccountInfo(positionKey);
  if (!info?.data) {
    return {
      exists: false,
      position_pda: positionKey.toBase58(),
      side: null,
      amount: "0",
      claimed: false,
    };
  }
  const parsed = parsePositionAccount(Buffer.from(info.data));
  return {
    ...parsed,
    position_pda: positionKey.toBase58(),
    amount: parsed.amount.toString(),
  };
}

async function resolveFixtureStatus(fixture_id) {
  let fixtureStatus = "scheduled";
  let homeTeam = null;
  let awayTeam = null;
  let score = null;
  let penScore = null;
  let clock = null;
  let kickoffAt = null;
  let wcFormat = "group";
  let edgeSnapshot = null;
  let hasOdds = false;

  try {
    const edge = await fetchMatchEdge(fixture_id);
    if (edge?.fixture) {
      fixtureStatus = edge.fixture.status ?? fixtureStatus;
      homeTeam = edge.fixture.homeTeam ?? null;
      awayTeam = edge.fixture.awayTeam ?? null;
      kickoffAt = edge.fixture.kickoffAt ?? kickoffAt;
      if (edge.fixture.wcFormat) wcFormat = edge.fixture.wcFormat;
    }
    if (edge?.score) score = edge.score;
    if (edge?.clock) clock = edge.clock;
    if (edge?.edge) edgeSnapshot = edge.edge;
    hasOdds = Array.isArray(edge?.odds) && edge.odds.length >= 2;
  } catch {
    /* fallback scores */
  }

  try {
    const scores = await fetchScores(fixture_id);
    if (scores?.score) score = scores.score;
    if (scores?.penScore) penScore = scores.penScore;
    if (scores?.clock) clock = scores.clock;
    if (scores?.status) fixtureStatus = scores.status;
  } catch {
    /* keep edge */
  }

  if (kickoffAt) {
    wcFormat = wcMatchFormat(kickoffAt);
  }

  let matchWinnerOutcome = null;
  if (fixtureStatus === "finished" && score) {
    matchWinnerOutcome = escrowOutcomeFromScore(score, wcFormat, penScore ?? undefined);
  }

  return {
    fixtureStatus,
    homeTeam,
    awayTeam,
    score,
    penScore,
    clock,
    kickoffAt,
    wcFormat,
    matchWinnerOutcome,
    edgeSnapshot,
    hasOdds,
  };
}

export async function fetchFixtureAgentStatus(fixture_id, agent_wallet) {
  const walletPk = parseOptionalAgentWallet(agent_wallet);
  const [fixtureMeta, poolSnap, position, clv] = await Promise.all([
    resolveFixtureStatus(fixture_id),
    fetchEscrowPool(fixture_id),
    readAgentPosition(fixture_id, agent_wallet),
    fetchClvVerdict().catch(() => null),
  ]);

  const pool = poolSnap.pool ?? {};
  const poolExists = pool.exists === true;
  const poolSettled = Boolean(pool.settled);
  const winningSide = typeof pool.winningSide === "number" ? pool.winningSide : 255;
  const sideTotals = Array.isArray(pool.sideTotals)
    ? pool.sideTotals
    : ["0", "0", "0"];
  const kickoffTs = typeof pool.kickoffTs === "number" ? pool.kickoffTs : 0;

  const positionAmount = position.exists ? BigInt(position.amount || "0") : 0n;
  let action = deriveAgentNextAction({
    fixtureStatus: fixtureMeta.fixtureStatus,
    poolExists: poolExists && pool.totalDeposited !== "0" ? true : poolExists,
    poolSettled,
    winningSide,
    sideTotals,
    kickoffTs,
    nowSec: Math.floor(Date.now() / 1000),
    positionExists: position.exists,
    positionAmount,
    positionSide: position.side,
    positionClaimed: position.claimed,
    matchWinnerOutcome: fixtureMeta.matchWinnerOutcome,
  });

  const depositPolicy = deriveDepositPolicy(fixtureMeta.edgeSnapshot, clv, {
    hasOdds: fixtureMeta.hasOdds,
  });

  if (!walletPk) {
    action = applyWalletlessAgentView(action, depositPolicy);
  } else {
    action = applyDepositPolicyToAction(action, depositPolicy);
  }

  return {
    ok: true,
    fixture_id,
    agent_wallet: walletPk ? walletPk.toBase58() : null,
    agent_capability: walletPk
      ? {
          has_wallet: true,
          can_sign_escrow: true,
          can_bet: depositPolicy.deposit_allowed,
          message: depositPolicy.deposit_allowed
            ? "Wallet connected — escrow build/broadcast tools available."
            : "Wallet connected — edge gate blocks new deposit on this fixture.",
        }
      : {
          has_wallet: false,
          can_sign_escrow: false,
          can_bet: false,
          message:
            "No agent_wallet — analysis only. Pass your Solana devnet pubkey when you have one.",
        },
    fixture: {
      status: fixtureMeta.fixtureStatus,
      homeTeam: fixtureMeta.homeTeam,
      awayTeam: fixtureMeta.awayTeam,
      score: fixtureMeta.score,
      penScore: fixtureMeta.penScore,
      clock: fixtureMeta.clock,
      wcFormat: fixtureMeta.wcFormat,
      matchWinnerOutcome: fixtureMeta.matchWinnerOutcome,
    },
    edge: fixtureMeta.edgeSnapshot,
    data_lab: { clv },
    deposit_policy: depositPolicy,
    pool: poolSnap.pool,
    pool_pda: poolSnap.pool_pda,
    pool_mode: action.pool_mode,
    position: walletPk ? position : EMPTY_AGENT_POSITION,
    ...action,
    tool_hints: {
      analyze_only: "get_match_edge + get_clv_verdict — no wallet required",
      need_wallet: "Pass agent_wallet (devnet pubkey) then build_escrow_* + submit_signed_escrow_tx",
      create_pool: "build_escrow_create_pool_tx",
      deposit: "build_escrow_deposit_tx",
      observe: "Edge/CLV gate blocks deposit — do not bet",
      settle: "get_cpi_settle_args + build_escrow_settle_tx",
      claim: "build_escrow_claim_tx",
      refund: "build_escrow_refund_tx",
      refund_all: "build_escrow_refund_all_tx",
      broadcast: "submit_signed_escrow_tx",
    },
  };
}
