/**
 * F77N — x402 paid-tool funnel: verify → cache → await settle → grant.
 */
import {
  buildPaymentRequirements,
  parsePaymentHeader,
} from "./x402-pundit.mjs";
import {
  createSettlementCache,
  isSettlementCacheEnabled,
  paymentDigestFromPayload,
  settlementCacheTtlMsFromEnv,
} from "./x402-settlement-cache.mjs";

export function isDeliverAfterSettleEnabled(env = process.env) {
  const v = env.PUNDIT_X402_DELIVER_AFTER_SETTLE_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

let sharedCache;

export function getSharedSettlementCache(env = process.env) {
  if (!isSettlementCacheEnabled(env)) return null;
  if (!sharedCache) {
    sharedCache = createSettlementCache({ ttlMs: settlementCacheTtlMsFromEnv(env) });
  }
  return sharedCache;
}

/** Test-only reset. */
export function resetSharedSettlementCache() {
  sharedCache = undefined;
}

/**
 * @param {object} params
 * @param {string} params.tool
 * @param {string|undefined} params.paymentRaw
 * @param {(payload: unknown, tool: string) => Promise<{isValid: boolean, error?: string}>} params.verifyPaymentFn
 * @param {(payload: unknown, requirements: unknown) => Promise<{success: boolean, txHash?: string, error?: string}>} params.settlePaymentFn
 * @param {ReturnType<typeof createSettlementCache>|null} [params.cache]
 * @param {NodeJS.ProcessEnv} [params.env]
 */
export async function processPunditX402Payment({
  tool,
  paymentRaw,
  verifyPaymentFn,
  settlePaymentFn,
  cache = getSharedSettlementCache(),
  env = process.env,
}) {
  if (!paymentRaw) return null;

  let paymentPayload;
  try {
    paymentPayload = parsePaymentHeader(paymentRaw);
  } catch {
    return { error: "invalid_x_payment", message: "Invalid x_payment format" };
  }

  const serverRequirements = buildPaymentRequirements(tool);
  const verification = await verifyPaymentFn(paymentPayload, serverRequirements);
  if (!verification.isValid) {
    return {
      error: "payment_invalid",
      message: `Payment invalid: ${verification.error || "unknown"}`,
    };
  }

  const digest = paymentDigestFromPayload(paymentPayload);
  if (cache) {
    const gate = cache.beginSettle(digest);
    if (!gate.allow) {
      return {
        error: gate.reason || "payment_already_used",
        message:
          gate.reason === "payment_settlement_in_progress"
            ? "Payment settlement already in progress"
            : "This payment was already used for a paid tool",
        txHash: gate.txHash ?? undefined,
      };
    }
  }

  const deliverAfterSettle = isDeliverAfterSettleEnabled(env);
  if (deliverAfterSettle) {
    const settled = await settlePaymentFn(paymentPayload, serverRequirements);
    if (!settled.success) {
      if (cache) cache.failSettle(digest);
      return {
        error: "settlement_failed",
        message: settled.error || "On-chain settlement failed",
      };
    }
    if (cache) cache.completeSettle(digest, settled.txHash);
    return {
      ok: true,
      bypass: "x402_paid",
      x402_verified: true,
      x402_settled: true,
      txHash: settled.txHash ?? null,
    };
  }

  settlePaymentFn(paymentPayload, serverRequirements)
    .then((result) => {
      if (!cache) return;
      if (result.success) cache.completeSettle(digest, result.txHash);
      else cache.failSettle(digest);
    })
    .catch(() => {
      if (cache) cache.failSettle(digest);
    });

  return { ok: true, bypass: "x402_paid", x402_verified: true, x402_settled: false };
}
