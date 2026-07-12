/**
 * F77N — MCP session client binding (IP + User-Agent fingerprint).
 */
import crypto from "node:crypto";

export function isSessionBindEnabled(env = process.env) {
  const v = env.PUNDIT_MCP_SESSION_BIND_ENABLED;
  // F91N: default OFF — Claude web / remote MCP uses rotating Anthropic egress IPs (403 mismatch if ON).
  if (v === undefined || v === "") return false;
  return v === "true" || v === "1";
}

export function clientKeyFromRequest({ ip, userAgent }) {
  const ipFirst = String(ip || "")
    .split(",")[0]
    .trim();
  const ua = String(userAgent || "").slice(0, 200);
  return crypto.createHash("sha256").update(`${ipFirst}|${ua}`).digest("hex");
}

export function clientKeyFromHttpRequest(req) {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "";
  return clientKeyFromRequest({ ip, userAgent });
}

export function registerSessionClient(store, sessionId, clientKey) {
  if (!sessionId || !clientKey) return;
  store.set(sessionId, { clientKey, at: Date.now() });
}

export function assertSessionClient(store, sessionId, clientKey) {
  if (!sessionId) return true;
  const row = store.get(sessionId);
  if (!row) return true;
  return row.clientKey === clientKey;
}

export function removeSessionClient(store, sessionId) {
  if (sessionId) store.delete(sessionId);
}
