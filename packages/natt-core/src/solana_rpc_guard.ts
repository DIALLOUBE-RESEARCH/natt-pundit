/**
 * F81N — JSON-RPC allowlist for public Solana proxy surfaces (gateway + web).
 */

const ALLOWED_METHODS = new Set([
  "getAccountInfo",
  "getBalance",
  "getTokenAccountBalance",
  "getLatestBlockhash",
  "getRecentBlockhash",
  "getSignatureStatuses",
  "sendTransaction",
  "getMinimumBalanceForRentExemption",
  "getFeeForMessage",
  "simulateTransaction",
  "getEpochInfo",
  "getSlot",
  "getVersion",
]);

const BLOCKED_METHODS = new Set(["requestAirdrop"]);

export const DEFAULT_RPC_PROXY_MAX_BYTES = 32_768;

export function isSolanaRpcProxyEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const v = env.NATT_SOLANA_RPC_PROXY_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

export type RpcGuardResult =
  | { ok: true; parsed: unknown }
  | { ok: false; code: string; status: number };

export function validateSolanaRpcRequest(
  body: string,
  opts?: { maxBytes?: number; enabled?: boolean },
): RpcGuardResult {
  if (opts?.enabled === false) {
    return { ok: false, code: "proxy_disabled", status: 503 };
  }

  const maxBytes = opts?.maxBytes ?? DEFAULT_RPC_PROXY_MAX_BYTES;
  if (body.length > maxBytes) {
    return { ok: false, code: "body_too_large", status: 413 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, code: "invalid_json", status: 400 };
  }

  const batch = Array.isArray(parsed) ? parsed : [parsed];
  for (const req of batch) {
    if (!req || typeof req !== "object") {
      return { ok: false, code: "invalid_request", status: 400 };
    }
    const method = (req as { method?: unknown }).method;
    if (typeof method !== "string" || !method) {
      return { ok: false, code: "missing_method", status: 400 };
    }
    if (BLOCKED_METHODS.has(method)) {
      return { ok: false, code: `blocked_method:${method}`, status: 403 };
    }
    if (!ALLOWED_METHODS.has(method)) {
      return { ok: false, code: `denied_method:${method}`, status: 403 };
    }
  }

  return { ok: true, parsed };
}
