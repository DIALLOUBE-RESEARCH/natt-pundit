import type { ScoresSnapshot } from "@natt-pundit/contracts";
import type { CommentaryEventType, CommentaryLang, CommentarySfx } from "@natt-pundit/natt-core";
import {
  buildMomentId,
  commentarySfxForEvent,
  renderCommentary,
} from "@natt-pundit/natt-core";

export type CommentaryMomentVisual = {
  score: { home: number; away: number };
  timelineEvent?: ScoresSnapshot["events"][number];
};

export type CommentaryMoment = {
  momentId: string;
  fixtureId: string;
  eventType: CommentaryEventType;
  lang: CommentaryLang;
  text: string;
  audioBase64: string;
  sfx: CommentarySfx;
  visual: CommentaryMomentVisual;
  status: "ready" | "failed";
};

type FixtureWatchState = {
  eventFingerprints: Set<string>;
  kickoffDone: boolean;
  halftimeDone: boolean;
  fulltimeDone: boolean;
  lastPhase?: string;
  seeded: boolean;
};

const watchByFixture = new Map<string, FixtureWatchState>();

function watchState(fixtureId: string): FixtureWatchState {
  let s = watchByFixture.get(fixtureId);
  if (!s) {
    s = {
      eventFingerprints: new Set(),
      kickoffDone: false,
      halftimeDone: false,
      fulltimeDone: false,
      seeded: false,
    };
    watchByFixture.set(fixtureId, s);
  }
  return s;
}

function eventFingerprint(e: ScoresSnapshot["events"][number]): string {
  return `${e.type}|${e.minute ?? "_"}|${e.team ?? "_"}|${e.player ?? "_"}`;
}

function mapTxEventType(type: string): CommentaryEventType | null {
  if (type === "goal") return "GOAL";
  if (type.includes("yellow")) return "YELLOW_CARD";
  if (type.includes("red") && type.includes("card")) return "RED_CARD";
  if (type.includes("substitution")) return "SUBSTITUTION";
  return null;
}

type MomentDraft = {
  momentId: string;
  eventType: CommentaryEventType;
  visual: CommentaryMomentVisual;
  vars: {
    player?: string;
    team?: string;
    minute?: number;
    scoreHome: number;
    scoreAway: number;
    homeTeam: string;
    awayTeam: string;
  };
};

function seedBaseline(state: FixtureWatchState, scores: ScoresSnapshot): void {
  if (state.seeded) return;
  state.seeded = true;
  for (const ev of scores.events) {
    state.eventFingerprints.add(eventFingerprint(ev));
  }
  const phase = scores.clock?.phase;
  if (phase) {
    state.lastPhase = phase;
    if (phase !== "pre") state.kickoffDone = true;
    if (phase === "HT" || phase === "2H" || phase === "ET" || phase === "FT" || phase === "PEN") {
      state.halftimeDone = true;
    }
    if (phase === "FT") state.fulltimeDone = true;
  }
}

function markEventSeen(state: FixtureWatchState, ev: ScoresSnapshot["events"][number]): void {
  state.eventFingerprints.add(eventFingerprint(ev));
}

function markDraftSeen(state: FixtureWatchState, draft: MomentDraft): void {
  if (draft.visual.timelineEvent) {
    markEventSeen(state, draft.visual.timelineEvent);
  }
}

export function detectMomentDrafts(
  fixtureId: string,
  scores: ScoresSnapshot,
  homeTeam: string,
  awayTeam: string,
): MomentDraft[] {
  const state = watchState(fixtureId);
  seedBaseline(state, scores);
  const drafts: MomentDraft[] = [];
  const score = scores.score;
  const phase = scores.clock?.phase;

  for (const ev of scores.events) {
    const fp = eventFingerprint(ev);
    if (state.eventFingerprints.has(fp)) continue;

    const eventType = mapTxEventType(ev.type);
    if (!eventType) {
      markEventSeen(state, ev);
      continue;
    }

    const momentId = buildMomentId({
      fixtureId,
      eventType,
      minute: ev.minute,
      team: ev.team,
      player: ev.player,
      scoreHome: score.home,
      scoreAway: score.away,
    });

    drafts.push({
      momentId,
      eventType,
      visual: { score: { ...score }, timelineEvent: ev },
      vars: {
        player: ev.player,
        team: ev.team,
        minute: ev.minute,
        scoreHome: score.home,
        scoreAway: score.away,
        homeTeam,
        awayTeam,
      },
    });
  }

  if (phase && phase !== state.lastPhase) {
    if (phase === "1H" && !state.kickoffDone) {
      state.kickoffDone = true;
      const eventType: CommentaryEventType = "MATCH_KICKOFF";
      drafts.push({
        momentId: buildMomentId({
          fixtureId,
          eventType,
          scoreHome: score.home,
          scoreAway: score.away,
        }),
        eventType,
        visual: { score: { ...score } },
        vars: {
          scoreHome: score.home,
          scoreAway: score.away,
          homeTeam,
          awayTeam,
        },
      });
    }
    if (phase === "HT" && !state.halftimeDone) {
      state.halftimeDone = true;
      const eventType: CommentaryEventType = "HALFTIME";
      drafts.push({
        momentId: buildMomentId({
          fixtureId,
          eventType,
          scoreHome: score.home,
          scoreAway: score.away,
        }),
        eventType,
        visual: { score: { ...score } },
        vars: {
          scoreHome: score.home,
          scoreAway: score.away,
          homeTeam,
          awayTeam,
        },
      });
    }
    if (phase === "FT" && !state.fulltimeDone) {
      state.fulltimeDone = true;
      const eventType: CommentaryEventType = "FULLTIME";
      drafts.push({
        momentId: buildMomentId({
          fixtureId,
          eventType,
          scoreHome: score.home,
          scoreAway: score.away,
        }),
        eventType,
        visual: { score: { ...score } },
        vars: {
          scoreHome: score.home,
          scoreAway: score.away,
          homeTeam,
          awayTeam,
        },
      });
    }
    state.lastPhase = phase;
  }

  return drafts;
}

export function draftToMoment(
  draft: MomentDraft,
  fixtureId: string,
  lang: CommentaryLang,
  audioBase64: string,
): CommentaryMoment {
  const text = renderCommentary(draft.eventType, lang, draft.vars);
  return {
    momentId: draft.momentId,
    fixtureId,
    eventType: draft.eventType,
    lang,
    text,
    audioBase64,
    sfx: commentarySfxForEvent(draft.eventType),
    visual: draft.visual,
    status: "ready",
  };
}

const readyMoments = new Map<string, CommentaryMoment>();
const inFlight = new Set<string>();

function storeKey(momentId: string, lang: CommentaryLang): string {
  return `${momentId}:${lang}`;
}

export function getReadyMoments(
  fixtureId: string,
  lang: CommentaryLang,
  exclude: Set<string>,
): CommentaryMoment[] {
  const out: CommentaryMoment[] = [];
  for (const m of readyMoments.values()) {
    if (m.fixtureId !== fixtureId || m.lang !== lang) continue;
    if (exclude.has(m.momentId)) continue;
    if (m.status === "ready") out.push(m);
  }
  return out.sort((a, b) => a.momentId.localeCompare(b.momentId));
}

export function markInFlight(momentId: string, lang: CommentaryLang): boolean {
  const k = storeKey(momentId, lang);
  if (inFlight.has(k) || readyMoments.has(k)) return false;
  inFlight.add(k);
  return true;
}

export function storeMoment(moment: CommentaryMoment): void {
  const k = storeKey(moment.momentId, moment.lang);
  inFlight.delete(k);
  readyMoments.set(k, moment);
}

export function markMomentDraftSeen(fixtureId: string, draft: MomentDraft): void {
  markDraftSeen(watchState(fixtureId), draft);
}

export function storeFailed(momentId: string, lang: CommentaryLang): void {
  inFlight.delete(storeKey(momentId, lang));
}
