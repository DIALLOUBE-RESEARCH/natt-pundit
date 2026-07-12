import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter, clientIpFromHeaders } from "./rate_limit.js";

describe("SlidingWindowRateLimiter", () => {
  it("allows up to limit hits inside the window", () => {
    let t = 0;
    const rl = new SlidingWindowRateLimiter(3, 1000, () => t);
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(true);
    const denied = rl.check("a");
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) expect(denied.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it("frees budget once the window slides", () => {
    let t = 0;
    const rl = new SlidingWindowRateLimiter(2, 1000, () => t);
    rl.check("a");
    rl.check("a");
    expect(rl.check("a").allowed).toBe(false);
    t = 1001;
    expect(rl.check("a").allowed).toBe(true);
  });

  it("isolates keys", () => {
    let t = 0;
    const rl = new SlidingWindowRateLimiter(1, 1000, () => t);
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("rejects invalid constructor knobs (DbC clamp)", () => {
    expect(() => new SlidingWindowRateLimiter(0, 1000)).toThrow("rate_limit_invalid_limit");
    expect(() => new SlidingWindowRateLimiter(5, 0)).toThrow("rate_limit_invalid_window");
  });
});

describe("clientIpFromHeaders", () => {
  it("takes first x-forwarded-for entry", () => {
    expect(clientIpFromHeaders("1.2.3.4, 10.0.0.1", "10.0.0.2")).toBe("1.2.3.4");
  });

  it("falls back to remote address then unknown", () => {
    expect(clientIpFromHeaders(undefined, "10.0.0.2")).toBe("10.0.0.2");
    expect(clientIpFromHeaders(undefined, undefined)).toBe("unknown");
  });
});
