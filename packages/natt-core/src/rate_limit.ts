/**
 * F95N — per-key sliding-window rate limiter for public proxy surfaces
 * (web /api/solana/rpc, gateway RPC relay). Pure, injectable clock, no I/O.
 */

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

const MAX_TRACKED_KEYS = 10_000;

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("rate_limit_invalid_limit");
    }
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new Error("rate_limit_invalid_window");
    }
  }

  /** Records a hit for `key` unless the window budget is exhausted. */
  check(key: string): RateLimitDecision {
    const t = this.now();
    const cutoff = t - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const retryAfterSec = Math.max(1, Math.ceil((recent[0] + this.windowMs - t) / 1000));
      return { allowed: false, retryAfterSec };
    }

    recent.push(t);
    this.sweepIfNeeded(cutoff);
    this.hits.set(key, recent);
    return { allowed: true };
  }

  /** Bounds memory: drop keys with no hits inside the current window. */
  private sweepIfNeeded(cutoff: number): void {
    if (this.hits.size < MAX_TRACKED_KEYS) return;
    for (const [key, timestamps] of this.hits) {
      if (!timestamps.some((ts) => ts > cutoff)) {
        this.hits.delete(key);
      }
    }
  }
}

/** First public IP from x-forwarded-for (nginx-fronted), else the socket address. */
export function clientIpFromHeaders(
  forwardedFor: string | string[] | undefined,
  remoteAddress: string | undefined,
): string {
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const first = raw?.split(",")[0]?.trim();
  return first || remoteAddress || "unknown";
}
