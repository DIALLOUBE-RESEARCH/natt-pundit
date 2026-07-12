/**
 * F92N — Deposit gate from public edge + Data Lab CLV (pure, no tuning).
 */

const CONVICTION_RANK = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function convictionRank(tier) {
  return CONVICTION_RANK[tier] ?? 0;
}

function normalizeEdge(edgePayload) {
  if (!edgePayload) return null;
  if (edgePayload.verdict === "SETUP" || edgePayload.verdict === "HOLD") {
    return edgePayload;
  }
  if (edgePayload.edge) return edgePayload.edge;
  return null;
}

/**
 * @param {object | null} edgePayload — PublicEdgeVerdict or MatchEdge wrapper
 * @param {object | null} clv — getClvVerdict() payload
 * @param {{ hasOdds?: boolean }} [opts]
 */
export function deriveDepositPolicy(edgePayload, clv, opts = {}) {
  const edge = normalizeEdge(edgePayload);
  const hasOdds = opts.hasOdds !== false;
  const clvVerdict = clv?.verdict ?? "unknown";
  const clvCertified = clvVerdict === "verified" || clvVerdict === "clv_verified";
  const clvIndicative = Boolean(clv?.indicative);

  const baseClv = {
    verdict: clvVerdict,
    n: clv?.n ?? 0,
    nMin: clv?.nMin ?? 500,
    indicative: clvIndicative,
    certified: clvCertified,
  };

  if (!edge) {
    return {
      deposit_allowed: false,
      deposit_gate: "edge_unavailable",
      suggested_side: null,
      stake_multiplier: 0,
      reason: "Edge unavailable — do not deposit until get_match_edge succeeds.",
      edge: null,
      clv: baseClv,
    };
  }

  const snapshot = {
    verdict: edge.verdict,
    conviction: edge.conviction ?? "none",
    direction: edge.direction ?? "none",
  };

  if (!hasOdds) {
    return {
      deposit_allowed: false,
      deposit_gate: "no_odds",
      suggested_side: null,
      stake_multiplier: 0,
      reason: "Incomplete odds — fail-closed, no new escrow deposit.",
      edge: snapshot,
      clv: baseClv,
    };
  }

  if (edge.verdict !== "SETUP") {
    return {
      deposit_allowed: false,
      deposit_gate: "hold",
      suggested_side: null,
      stake_multiplier: 0,
      reason: "HOLD — model aligns with Shin consensus. No new autonomous bet.",
      edge: snapshot,
      clv: baseClv,
    };
  }

  if (!edge.direction || edge.direction === "none") {
    return {
      deposit_allowed: false,
      deposit_gate: "setup_no_direction",
      suggested_side: null,
      stake_multiplier: 0,
      reason: "SETUP without direction — wait for a clear side.",
      edge: snapshot,
      clv: baseClv,
    };
  }

  if (convictionRank(edge.conviction) < CONVICTION_RANK.medium) {
    return {
      deposit_allowed: false,
      deposit_gate: "low_conviction",
      suggested_side: edge.direction,
      stake_multiplier: 0,
      reason: "SETUP conviction too low (need medium or high). Observe only.",
      edge: snapshot,
      clv: baseClv,
    };
  }

  if (clvCertified) {
    return {
      deposit_allowed: true,
      deposit_gate: "setup_clv_verified",
      suggested_side: edge.direction,
      stake_multiplier: 1,
      reason: "SETUP + CLV verified — deposit on suggested_side allowed (full stake).",
      edge: snapshot,
      clv: baseClv,
    };
  }

  return {
    deposit_allowed: true,
    deposit_gate: "setup_clv_not_proven",
    suggested_side: edge.direction,
    stake_multiplier: 0.5,
    reason:
      "SETUP with medium+ conviction but CLV not proven yet — half stake max or observe. Check get_clv_verdict.",
    edge: snapshot,
    clv: baseClv,
  };
}

/**
 * Apply deposit policy to escrow next_action when opening a new position.
 * @param {ReturnType<typeof deriveAgentNextAction>} action
 * @param {ReturnType<typeof deriveDepositPolicy>} policy
 */
export function applyDepositPolicyToAction(action, policy) {
  if (policy.deposit_allowed) {
    return {
      ...action,
      deposit_policy: policy,
      suggested_deposit_side: policy.suggested_side,
      stake_multiplier: policy.stake_multiplier,
    };
  }

  if (action.next_action !== "deposit") {
    return { ...action, deposit_policy: policy };
  }

  return {
    ...action,
    next_action: "observe",
    deposit_blocked: true,
    deposit_policy: policy,
    suggested_deposit_side: policy.suggested_side,
    stake_multiplier: 0,
    detail: policy.reason,
    previous_next_action: action.next_action,
  };
}

const EMPTY_POSITION = {
  exists: false,
  position_pda: null,
  side: null,
  amount: "0",
  claimed: false,
};

export { EMPTY_POSITION as EMPTY_AGENT_POSITION };

export const STOP_BET_NEXT_ACTIONS = ["observe", "analyze_only"];

export const NEXT_ACTION_MEANINGS = {
  analyze_only: "No agent_wallet — analysis only; explain edge/CLV, do not build escrow txs.",
  observe: "Wallet present but edge or CLV gate blocks deposit.",
  deposit: "May call build_escrow_deposit_tx when deposit_policy.deposit_allowed is true.",
  create_pool: "Pool missing on devnet — build_escrow_create_pool_tx first (wallet required).",
  wait_match: "Position open — wait for match end.",
  settle: "Match finished — settle pool via CPI.",
  claim: "Pool settled on your side — claim winnings.",
  refund: "Unmatched pool — full refund.",
  refund_all: "Void winning issue — refund all.",
  done: "Terminal — no further escrow action.",
  none: "No action available.",
};

/**
 * Canonical stop gate before build_escrow_deposit_tx (F92N-AY).
 * @param {object | null | undefined} status — get_fixture_agent_status payload
 */
export function shouldStopBet(status) {
  if (!status || typeof status !== "object") {
    return { stop: true, reason: "invalid_status" };
  }
  if (status.escrow_blocked === true) {
    return { stop: true, reason: status.escrow_block_reason || "escrow_blocked" };
  }
  if (status.deposit_policy?.deposit_allowed === false) {
    return { stop: true, reason: status.deposit_policy.deposit_gate || "deposit_not_allowed" };
  }
  if (status.agent_capability?.can_bet === false) {
    return { stop: true, reason: "can_bet_false" };
  }
  if (STOP_BET_NEXT_ACTIONS.includes(status.next_action)) {
    return { stop: true, reason: status.next_action };
  }
  return { stop: false, reason: null };
}

export const AGENT_STOP_BET_CONDITIONS = {
  description: "If ANY check matches, do NOT call build_escrow_deposit_tx.",
  checks: [
    "escrow_blocked === true",
    "deposit_policy.deposit_allowed === false",
    "agent_capability.can_bet === false",
    "next_action in ['observe', 'analyze_only']",
  ],
  next_action_meanings: NEXT_ACTION_MEANINGS,
  helper: "shouldStopBet(status) → { stop, reason }",
};

/**
 * Wallet-less agents still get edge + CLV + deposit_policy; escrow stays blocked.
 * @param {object} action
 * @param {ReturnType<typeof deriveDepositPolicy>} policy
 */
export function applyWalletlessAgentView(action, policy) {
  const escrowWould = action.next_action;
  const canBetSignal = policy.deposit_allowed;
  return {
    ...action,
    next_action: "analyze_only",
    agent_capability: {
      has_wallet: false,
      can_sign_escrow: false,
      can_bet: false,
      message:
        "No agent_wallet provided — analysis only. Connect a Solana devnet wallet (pubkey) to build or broadcast escrow txs.",
    },
    escrow_blocked: true,
    escrow_block_reason: "agent_wallet_not_provided",
    hypothetical_escrow_action: escrowWould,
    would_bet_if_wallet: canBetSignal,
    deposit_policy: policy,
    suggested_deposit_side: policy.suggested_side,
    stake_multiplier: canBetSignal ? policy.stake_multiplier : 0,
    detail: canBetSignal
      ? `Signal OK (${policy.deposit_gate}) but no wallet — cannot deposit. ${policy.reason}`
      : `No bet recommended (${policy.deposit_gate}). ${policy.reason}`,
    position: EMPTY_POSITION,
  };
}
