import type { CommentaryEventType } from "./commentary_types.js";

export type MomentIdInput = {
  fixtureId: string;
  eventType: CommentaryEventType;
  minute?: number;
  team?: string;
  player?: string;
  scoreHome: number;
  scoreAway: number;
};

/** Stable dedupe key for hold/release pipeline (AV-0). */
export function buildMomentId(input: MomentIdInput): string {
  const m = input.minute ?? "_";
  const t = input.team ?? "_";
  const p = input.player?.trim() || "_";
  return `${input.fixtureId}:${input.eventType}:${m}:${t}:${p}:${input.scoreHome}-${input.scoreAway}`;
}
