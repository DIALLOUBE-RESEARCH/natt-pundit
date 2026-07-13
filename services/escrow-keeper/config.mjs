/** F96N P1 — env clamps (fail-closed when disabled). */

export function keeperEnabled() {
  const raw = process.env.NATT_PUNDIT_ESCROW_KEEPER_ENABLED;
  if (raw === undefined || raw === "") return false;
  return raw === "true" || raw === "1";
}

export function gatewayUrl() {
  return (process.env.PUNDIT_GATEWAY_URL || "http://natt-pundit-gateway:4001").replace(/\/$/, "");
}

export function pollIntervalMs() {
  const n = Number(process.env.ESCROW_KEEPER_POLL_MS);
  if (!Number.isFinite(n)) return 60_000;
  return Math.min(300_000, Math.max(15_000, Math.floor(n)));
}

export function keeperPort() {
  const n = Number(process.env.ESCROW_KEEPER_PORT);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4013;
}
