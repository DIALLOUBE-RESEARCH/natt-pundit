import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PUNDIT_PRICE_ATOMIC,
  buildPaymentRequirements,
  buildPaymentRequired,
  isPaytoConfigured,
} from "../x402-pundit.mjs";

describe("x402-pundit", () => {
  it("price atomic is 10000 for $0.01", () => {
    assert.equal(PUNDIT_PRICE_ATOMIC, "10000");
  });

  it("buildPaymentRequired includes accepts", () => {
    process.env.PUNDIT_X402_PAYTO = "2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg";
    const body = buildPaymentRequired("get_match_edge");
    assert.equal(body.x402Version, 2);
    assert.ok(Array.isArray(body.accepts));
    assert.equal(body.accepts.length, 1);
    assert.equal(body.accepts[0].amount, "10000");
    assert.ok(isPaytoConfigured());
  });

  it("buildPaymentRequirements uses devnet network", () => {
    process.env.PUNDIT_X402_PAYTO = "TestPayTo1111111111111111111111111111111";
    const req = buildPaymentRequirements("test");
    assert.match(req.network, /^solana:/);
    assert.equal(req.payTo, "TestPayTo1111111111111111111111111111111");
  });
});
