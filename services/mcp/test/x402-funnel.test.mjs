import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createSettlementCache } from "../x402-settlement-cache.mjs";
import {
  processPunditX402Payment,
  resetSharedSettlementCache,
} from "../x402-funnel.mjs";

function b64(obj) {
  return Buffer.from(JSON.stringify(obj), "utf-8").toString("base64");
}

describe("x402-funnel", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.PUNDIT_X402_PAYTO = "TestPayTo1111111111111111111111111111111";
    process.env.PUNDIT_X402_DELIVER_AFTER_SETTLE_ENABLED = "true";
    process.env.PUNDIT_X402_SETTLEMENT_CACHE_ENABLED = "true";
    resetSharedSettlementCache();
  });

  afterEach(() => {
    process.env = { ...envBackup };
    resetSharedSettlementCache();
  });

  it("returns null when paymentRaw missing", async () => {
    const out = await processPunditX402Payment({
      tool: "get_match_edge",
      paymentRaw: undefined,
      verifyPaymentFn: async () => ({ isValid: true }),
      settlePaymentFn: async () => ({ success: true }),
      cache: null,
    });
    assert.equal(out, null);
  });

  it("PROP-2: settle fail => settlement_failed, no ok", async () => {
    const payload = { x402Version: 2, scheme: "exact", amount: "10000" };
    const raw = b64(payload);
    const cache = createSettlementCache();
    const out = await processPunditX402Payment({
      tool: "get_match_edge",
      paymentRaw: raw,
      verifyPaymentFn: async () => ({ isValid: true }),
      settlePaymentFn: async () => ({ success: false, error: "rpc_down" }),
      cache,
    });
    assert.equal(out.error, "settlement_failed");
    assert.equal(out.ok, undefined);
  });

  it("deliver-after-settle: success marks digest used", async () => {
    const payload = { x402Version: 2, scheme: "exact", amount: "10000" };
    const raw = b64(payload);
    const cache = createSettlementCache();
    const out = await processPunditX402Payment({
      tool: "get_match_edge",
      paymentRaw: raw,
      verifyPaymentFn: async () => ({ isValid: true }),
      settlePaymentFn: async () => ({ success: true, txHash: "sol-tx-1" }),
      cache,
    });
    assert.equal(out.ok, true);
    assert.equal(out.x402_settled, true);
    assert.equal(out.txHash, "sol-tx-1");

    const replay = await processPunditX402Payment({
      tool: "get_match_odds",
      paymentRaw: raw,
      verifyPaymentFn: async () => ({ isValid: true }),
      settlePaymentFn: async () => ({ success: true, txHash: "sol-tx-2" }),
      cache,
    });
    assert.equal(replay.error, "payment_already_used");
  });

  it("verify uses server requirements (mock receives payTo from env)", async () => {
    const payload = { x402Version: 2, accepted: { payTo: "EvilPayTo111111111111111111111111111111" } };
    const raw = b64(payload);
    let seenPayTo = "";
    await processPunditX402Payment({
      tool: "get_match_edge",
      paymentRaw: raw,
      verifyPaymentFn: async (_payload, reqs) => {
        seenPayTo = reqs.payTo;
        return { isValid: true };
      },
      settlePaymentFn: async () => ({ success: true, txHash: "t" }),
      cache: createSettlementCache(),
    });
    assert.equal(seenPayTo, process.env.PUNDIT_X402_PAYTO);
  });
});
