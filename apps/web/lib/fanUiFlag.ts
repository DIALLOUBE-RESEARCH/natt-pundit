/** F96N — fan bet slip UX (build-time). Legacy EscrowPanel when false. */
export const fanBetUxEnabled = process.env.NEXT_PUBLIC_NATT_FAN_BET_UX_ENABLED === "true";

/** P1 — hide manual settle; show « Reglement en cours… » when true. */
export const escrowKeeperEnabled =
  process.env.NEXT_PUBLIC_NATT_ESCROW_KEEPER_ENABLED === "true";
