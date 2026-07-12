export type EscrowPhase =
  | "connect"
  | "create_pool"
  | "deposit"
  | "wait_match"
  | "live_locked"
  | "wait_proof"
  | "settle"
  | "claim"
  | "done";

export type EscrowPhaseInput = {
  hasWallet: boolean;
  poolExists: boolean;
  poolSettled: boolean;
  beforeKickoff: boolean;
  status: "scheduled" | "live" | "finished";
  proofValidated: boolean;
};

export function resolveEscrowPhase(input: EscrowPhaseInput): EscrowPhase {
  const { hasWallet, poolExists, poolSettled, beforeKickoff, status, proofValidated } = input;

  if (poolSettled) {
    return "claim";
  }
  if (status === "finished") {
    if (!poolExists) return "done";
    if (proofValidated) return "settle";
    return "wait_proof";
  }
  if (status === "live") {
    return "live_locked";
  }
  if (!beforeKickoff) {
    return poolExists ? "wait_match" : "done";
  }
  if (!hasWallet) {
    return "connect";
  }
  if (!poolExists) {
    return "create_pool";
  }
  return "deposit";
}

export function formatKickoffCountdown(
  kickoffMs: number,
  nowMs: number,
  copy: {
    countdownDays: (d: number, h: number) => string;
    countdownHours: (h: number, m: number) => string;
    countdownMinutes: (m: number) => string;
  },
): string | null {
  if (!Number.isFinite(kickoffMs) || nowMs >= kickoffMs) return null;
  const sec = Math.max(0, Math.floor((kickoffMs - nowMs) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return copy.countdownDays(d, h % 24);
  }
  if (h > 0) {
    return copy.countdownHours(h, m);
  }
  return copy.countdownMinutes(m);
}

export function escrowBettableBeforeKickoff(
  kickoffAt: string,
  status: "scheduled" | "live" | "finished",
  nowMs: number = Date.now(),
): boolean {
  if (status === "finished" || status === "live") return false;
  const kickoffMs = Date.parse(kickoffAt);
  return Number.isFinite(kickoffMs) && nowMs < kickoffMs;
}
