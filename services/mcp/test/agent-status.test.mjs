import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveAgentNextAction, parsePositionAccount } from "../agent-status.mjs";

const SOLO = ["1000000", "0", "0"];
const DUO = ["1000000", "500000", "0"];

function base(overrides = {}) {
  return {
    fixtureStatus: "scheduled",
    poolExists: true,
    poolSettled: false,
    winningSide: 255,
    sideTotals: SOLO,
    kickoffTs: 1000,
    nowSec: 500,
    positionExists: true,
    positionAmount: 1_000_000n,
    positionSide: 0,
    positionClaimed: false,
    ...overrides,
  };
}

describe("agent-status", () => {
  it("deriveAgentNextAction — create_pool when no pool", () => {
    const r = deriveAgentNextAction({
      fixtureStatus: "scheduled",
      poolExists: false,
      poolSettled: false,
      winningSide: 255,
      sideTotals: SOLO,
      kickoffTs: 0,
      nowSec: 0,
      positionExists: false,
      positionAmount: 0n,
      positionSide: null,
      positionClaimed: false,
    });
    assert.equal(r.next_action, "create_pool");
  });

  it("deriveAgentNextAction — deposit when pool exists no position", () => {
    const r = deriveAgentNextAction({
      fixtureStatus: "live",
      poolExists: true,
      poolSettled: false,
      winningSide: 255,
      sideTotals: SOLO,
      kickoffTs: 1000,
      nowSec: 2000,
      positionExists: false,
      positionAmount: 0n,
      positionSide: null,
      positionClaimed: false,
    });
    assert.equal(r.next_action, "deposit");
  });

  it("deriveAgentNextAction — refund unmatched after kickoff", () => {
    const r = deriveAgentNextAction(
      base({
        fixtureStatus: "live",
        nowSec: 2000,
        kickoffTs: 1000,
      }),
    );
    assert.equal(r.next_action, "refund");
    assert.equal(r.refundable, true);
    assert.equal(r.pool_mode, "unmatched");
  });

  it("deriveAgentNextAction — settle after match when parimutuel", () => {
    const r = deriveAgentNextAction(
      base({
        fixtureStatus: "finished",
        sideTotals: DUO,
        nowSec: 2000,
      }),
    );
    assert.equal(r.next_action, "settle");
    assert.equal(r.settleable, true);
    assert.equal(r.suggested_outcome, "home");
    assert.equal(r.pool_mode, "parimutuel");
  });

  it("deriveAgentNextAction — settle uses match winner not position side", () => {
    const r = deriveAgentNextAction(
      base({
        fixtureStatus: "finished",
        sideTotals: DUO,
        positionSide: 0,
        nowSec: 2000,
        matchWinnerOutcome: "away",
      }),
    );
    assert.equal(r.next_action, "settle");
    assert.equal(r.suggested_outcome, "away");
  });

  it("deriveAgentNextAction — claim when winner settled", () => {
    const r = deriveAgentNextAction(
      base({
        fixtureStatus: "finished",
        poolSettled: true,
        winningSide: 0,
        sideTotals: DUO,
        nowSec: 2000,
      }),
    );
    assert.equal(r.next_action, "claim");
    assert.equal(r.claimable, true);
  });

  it("deriveAgentNextAction — refund_all void winning side", () => {
    const r = deriveAgentNextAction(
      base({
        fixtureStatus: "finished",
        poolSettled: true,
        winningSide: 1,
        sideTotals: ["1000000", "0", "1000000"],
        nowSec: 2000,
      }),
    );
    assert.equal(r.next_action, "refund_all");
    assert.equal(r.refundable, true);
  });

  it("parsePositionAccount reads amount and claimed", () => {
    const buf = Buffer.alloc(90);
    buf[72] = 1;
    buf.writeBigUInt64LE(20_000n, 73);
    buf[81] = 0;
    const p = parsePositionAccount(buf);
    assert.equal(p.side, 1);
    assert.equal(p.amount, 20_000n);
    assert.equal(p.claimed, false);
  });
});
