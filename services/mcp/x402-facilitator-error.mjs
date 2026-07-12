/** Minimal CDP facilitator error parser (fork Terminal MCP). */

function asRecord(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  return null;
}

function strField(obj, key) {
  if (!obj) return undefined;
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function parseCdpFacilitatorError(err) {
  const response = err && typeof err === "object" ? err.response : null;
  const httpStatus = typeof response?.status === "number" ? response.status : undefined;
  const data = asRecord(response?.data);
  const cdpErrorMessage = strField(data, "errorMessage");
  const invalidReason = strField(data, "invalidReason");
  const message = err instanceof Error ? err.message : String(err);
  const summary = cdpErrorMessage || invalidReason || message;
  return { summary: String(summary).slice(0, 500) };
}

export function formatFacilitatorErrorForStorage(parsed, maxLen = 500) {
  return String(parsed.summary || "").slice(0, maxLen);
}
