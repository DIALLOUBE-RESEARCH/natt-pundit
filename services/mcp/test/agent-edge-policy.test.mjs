import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyDepositPolicyToAction,
  applyWalletlessAgentView,
  deriveDepositPolicy,
  shouldStopBet,
} from "../agent-edge-policy.mjs";

const CLV_OPEN = {
  verdict: "not_verified_yet",
  n: 16,
  nMin: 500,
  indicative: true,
};

const CLV_OK = {
  verdict: "verified",
  n: 520,
  nMin: 500,
  indicative: false,
};

describe("agent-edge-policy F92N", () => {
  it("blocks deposit on HOLD", () => {
    const p = deriveDepositPolicy(
      { verdict: "HOLD", conviction: "none", direction: "none" },
      CLV_OPEN,
    );
    assert.equal(p.deposit_allowed, false);
    assert.equal(p.deposit_gate, "hold");
  });

  it("allows half stake on SETUP medium when CLV not proven", () => {
    const p = deriveDepositPolicy(
      { verdict: "SETUP", conviction: "medium", direction: "away" },
      CLV_OPEN,
    );
    assert.equal(p.deposit_allowed, true);
    assert.equal(p.suggested_side, "away");
    assert.equal(p.stake_multiplier, 0.5);
  });

  it("allows full stake when CLV verified", () => {
    const p = deriveDepositPolicy(
      { verdict: "SETUP", conviction: "high", direction: "home" },
      CLV_OK,
    );
    assert.equal(p.deposit_gate, "setup_clv_verified");
    assert.equal(p.stake_multiplier, 1);
  });

  it("observe replaces deposit when blocked", () => {
    const action = { next_action: "deposit", detail: "Open position" };
    const policy = deriveDepositPolicy(
      { verdict: "HOLD", conviction: "none", direction: "none" },
      CLV_OPEN,
    );
    const out = applyDepositPolicyToAction(action, policy);
    assert.equal(out.next_action, "observe");
    assert.equal(out.deposit_blocked, true);
    assert.equal(out.previous_next_action, "deposit");
  });

  it("walletless mode is analyze_only with escrow blocked", () => {
    const action = { next_action: "deposit", pool_mode: "parimutuel" };
    const policy = deriveDepositPolicy(
      { verdict: "SETUP", conviction: "high", direction: "home" },
      CLV_OPEN,
    );
    const out = applyWalletlessAgentView(action, policy);
    assert.equal(out.next_action, "analyze_only");
    assert.equal(out.escrow_blocked, true);
    assert.equal(out.would_bet_if_wallet, true);
    assert.equal(out.hypothetical_escrow_action, "deposit");
  });

  it("shouldStopBet catches analyze_only and observe", () => {
    assert.equal(shouldStopBet({ next_action: "analyze_only" }).stop, true);
    assert.equal(shouldStopBet({ next_action: "observe" }).stop, true);
    assert.equal(
      shouldStopBet({ deposit_policy: { deposit_allowed: false } }).reason,
      "deposit_not_allowed",
    );
    assert.equal(shouldStopBet({ next_action: "deposit", deposit_policy: { deposit_allowed: true }, agent_capability: { can_bet: true } }).stop, false);
  });
});
