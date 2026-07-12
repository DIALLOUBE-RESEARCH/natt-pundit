export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
};

export function parseKickoffMs(kickoffAt: string): number | null {
  const ms = Date.parse(kickoffAt);
  return Number.isFinite(ms) ? ms : null;
}

/** Remaining time until kickoff; null if kickoff missing or already passed. */
export function splitCountdownParts(kickoffMs: number, nowMs: number): CountdownParts | null {
  if (!Number.isFinite(kickoffMs) || !Number.isFinite(nowMs)) return null;
  const totalSeconds = Math.max(0, Math.floor((kickoffMs - nowMs) / 1000));
  if (totalSeconds <= 0) return null;
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Stadium-style digits: DD:HH:MM:SS or HH:MM:SS when < 24h. */
export function formatCountdownDigits(parts: CountdownParts): string {
  if (parts.days > 0) {
    return `${pad2(parts.days)}:${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
  }
  return `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
}

/** Live stadium clock — 1s tick so seconds decrement without page refresh. */
export function countdownTickMs(_parts: CountdownParts | null): number {
  return 1000;
}
