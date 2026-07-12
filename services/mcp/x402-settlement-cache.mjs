/**
 * F77N — in-memory SettlementCache (Solana x402 double-settle guard).
 */
import crypto from "node:crypto";

export const DEFAULT_SETTLEMENT_CACHE_TTL_MS = 120_000;

export function paymentDigestFromPayload(paymentPayload) {
  const raw = JSON.stringify(paymentPayload ?? {});
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function parseTtlMs(ttlSec) {
  const n = Number(ttlSec);
  if (!Number.isFinite(n)) return DEFAULT_SETTLEMENT_CACHE_TTL_MS;
  const clamped = Math.min(600, Math.max(30, Math.floor(n)));
  return clamped * 1000;
}

export function settlementCacheTtlMsFromEnv(env = process.env) {
  return parseTtlMs(env.PUNDIT_X402_SETTLEMENT_CACHE_TTL_SEC ?? "120");
}

export function isSettlementCacheEnabled(env = process.env) {
  const v = env.PUNDIT_X402_SETTLEMENT_CACHE_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

export function createSettlementCache({
  ttlMs = DEFAULT_SETTLEMENT_CACHE_TTL_MS,
  now = () => Date.now(),
} = {}) {
  /** @type {Map<string, { status: 'settling'|'settled', at: number, txHash?: string }>} */
  const entries = new Map();

  function prune() {
    const t = now();
    for (const [digest, row] of entries) {
      if (t - row.at > ttlMs) entries.delete(digest);
    }
  }

  function beginSettle(digest) {
    prune();
    const row = entries.get(digest);
    if (row?.status === "settled") {
      return { allow: false, reason: "payment_already_used", txHash: row.txHash ?? null };
    }
    if (row?.status === "settling") {
      return { allow: false, reason: "payment_settlement_in_progress" };
    }
    entries.set(digest, { status: "settling", at: now() });
    return { allow: true };
  }

  function completeSettle(digest, txHash) {
    entries.set(digest, { status: "settled", at: now(), txHash: txHash ?? null });
  }

  function failSettle(digest) {
    const row = entries.get(digest);
    if (row?.status === "settling") entries.delete(digest);
  }

  function reset() {
    entries.clear();
  }

  function get(digest) {
    prune();
    return entries.get(digest) ?? null;
  }

  return { beginSettle, completeSettle, failSettle, reset, get };
}
