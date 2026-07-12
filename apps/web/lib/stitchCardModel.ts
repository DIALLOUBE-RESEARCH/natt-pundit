import type { Fixture, PublicEdgeSummaryItem, PublicMatchEdge } from "@natt-pundit/contracts";
import type { AppLang } from "@/lib/locales";
import { formatKickoffDate, formatKickoffTime } from "@/lib/formatLocale";
import { liveIndicator } from "@/lib/matchStatus";
import { holdPillValue } from "@/lib/edgePublicI18n";
import { ui } from "@/lib/i18n";
import { stitchStadiumLabel } from "@/lib/stadiumI18n";
import { STITCH_STADIUM_ASSETS, type StitchStadiumKey } from "@/lib/uiAssets";

export type GlowVariant = "glow-red" | "glow-gold" | "glow-blue" | "glow-green";

export type StitchCardModel = {
  fixtureId: string;
  home: string;
  away: string;
  stadiumName: string;
  kickoff: string;
  scoreOrTime: string;
  status: string;
  hold: string;
  setup: string;
  isLive: boolean;
  isFinished: boolean;
  isSetup: boolean;
  glow: GlowVariant;
  stadiumAsset: StitchStadiumKey;
};

const STADIUM_KEYS = Object.keys(STITCH_STADIUM_ASSETS) as StitchStadiumKey[];

function stadiumKey(fixtureId: string): StitchStadiumKey {
  let hash = 0;
  for (let i = 0; i < fixtureId.length; i += 1) {
    hash = (hash + fixtureId.charCodeAt(i)) % STADIUM_KEYS.length;
  }
  return STADIUM_KEYS[hash] ?? "metlife";
}

function glowFor(setup: boolean, live: boolean, fixtureId: string): GlowVariant {
  if (live) return "glow-red";
  if (setup) return "glow-green";
  const keys: GlowVariant[] = ["glow-gold", "glow-blue", "glow-green"];
  let hash = 0;
  for (let i = 0; i < fixtureId.length; i += 1) {
    hash = (hash + fixtureId.charCodeAt(i)) % keys.length;
  }
  return keys[hash] ?? "glow-gold";
}

function edgePillDisplay(
  edge: PublicEdgeSummaryItem | undefined,
  homeTeam: string,
  awayTeam: string,
  lang: AppLang,
): { setup: string; hold: string; isSetup: boolean } {
  const isSetup = edge?.verdict === "SETUP";
  if (!isSetup || !edge) {
    return { isSetup: false, setup: "", hold: holdPillValue(lang) };
  }
  return {
    isSetup: true,
    setup: "",
    hold: "",
  };
}

export function fixtureToStitchCard(
  fixture: Fixture,
  edge: PublicEdgeSummaryItem | undefined,
  lang: AppLang,
): StitchCardModel {
  const t = ui(lang);
  const status = edge?.status ?? fixture.status;
  const score = edge?.score ?? fixture.score;
  const live = status === "live";
  const finished = status === "finished";
  const clock = edge?.clock;
  const { setup, hold, isSetup } = edgePillDisplay(
    edge,
    fixture.homeTeam,
    fixture.awayTeam,
    lang,
  );

  const scoreOrTime =
    (live || finished) && score
      ? `${score.home} - ${score.away}`
      : formatKickoffTime(fixture.kickoffAt, lang);

  const statusLine = live
    ? `• ${liveIndicator(status, clock, t, lang)}`
    : finished
      ? t.statusFinished
      : "";

  const asset = stadiumKey(fixture.fixtureId);

  return {
    fixtureId: fixture.fixtureId,
    home: fixture.homeTeam,
    away: fixture.awayTeam,
    stadiumName: stitchStadiumLabel(asset, lang),
    kickoff: formatKickoffDate(fixture.kickoffAt, lang),
    scoreOrTime,
    status: statusLine,
    hold,
    setup,
    isLive: live,
    isFinished: finished,
    isSetup,
    glow: glowFor(isSetup, live, fixture.fixtureId),
    stadiumAsset: asset,
  };
}

/** Bridge match detail payload → summary shape used by fixture cards. */
export function matchEdgeToSummaryItem(data: PublicMatchEdge): PublicEdgeSummaryItem {
  return {
    fixtureId: data.fixture.fixtureId,
    verdict: data.edge.verdict,
    conviction: data.edge.conviction,
    direction: data.edge.direction,
    hasOdds: data.odds.length > 0,
    status: data.fixture.status,
    score: data.fixture.score,
    clock: data.scores?.clock,
  };
}
