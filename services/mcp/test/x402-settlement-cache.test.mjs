import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSettlementCache,
  paymentDigestFromPayload,
  settlementCacheTtlMsFromEnv,
} from "../x402-settlement-cache.mjs";

describe("x402-settlement-cache", () => {
  it("paymentDigestFromPayload is stable", () => {
    const p = { x402Version: 2, scheme: "exact", amount: "10000" };
    assert.equal(paymentDigestFromPayload(p), paymentDigestFromPayload(p));
  });

  it("PROP-1: only one beginSettle allowed per digest until complete", () => {
    let t = 1_000;
    const cache = createSettlementCache({ ttlMs: 120_000, now: () => t });
    const digest = "abc123";

    assert.deepEqual(cache.beginSettle(digest), { allow: true });
    assert.deepEqual(cache.beginSettle(digest), {
      allow: false,
      reason: "payment_settlement_in_progress",
    });

    cache.completeSettle(digest, "tx1");
    assert.deepEqual(cache.beginSettle(digest), {
      allow: false,
      reason: "payment_already_used",
      txHash: "tx1",
    });
  });

  it("PROP-1 loop: N concurrent begins => 1 allow", () => {
    const cache = createSettlementCache();
    const digest = paymentDigestFromPayload({ n: 42 });
    let allowed = 0;
    for (let i = 0; i < 20; i += 1) {
      if (cache.beginSettle(digest).allow) allowed += 1;
    }
    assert.equal(allowed, 1);
  });

  it("failSettle releases in-progress lock for retry", () => {
    const cache = createSettlementCache();
    const digest = "retry-me";
    assert.equal(cache.beginSettle(digest).allow, true);
    cache.failSettle(digest);
    assert.equal(cache.beginSettle(digest).allow, true);
  });

  it("TTL expiry allows reuse after window", () => {
    let t = 0;
    const cache = createSettlementCache({ ttlMs: 1000, now: () => t });
    const digest = "ttl-digest";
    cache.beginSettle(digest);
    cache.completeSettle(digest, "tx-old");
    t = 2000;
    assert.equal(cache.beginSettle(digest).allow, true);
  });

  it("settlementCacheTtlMsFromEnv clamps 30-600 sec", () => {
    assert.equal(settlementCacheTtlMsFromEnv({ PUNDIT_X402_SETTLEMENT_CACHE_TTL_SEC: "10" }), 30_000);
    assert.equal(settlementCacheTtlMsFromEnv({ PUNDIT_X402_SETTLEMENT_CACHE_TTL_SEC: "999" }), 600_000);
    assert.equal(settlementCacheTtlMsFromEnv({}), 120_000);
  });
});
