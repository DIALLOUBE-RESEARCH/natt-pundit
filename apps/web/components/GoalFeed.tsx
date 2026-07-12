import type { ScoresSnapshot } from "@natt-pundit/contracts";
import type { AppLang } from "@/lib/locales";
import {
  isShootoutEvent,
  penaltyEventKindLabel,
  penaltyKickLabel,
  penaltyShootoutScore,
  PENALTY_SECTION_TITLE,
  shootoutKickIndex,
} from "@/lib/penaltyI18n";
import { teamShortLabel } from "@/lib/teamDisplay";

type MatchEvent = ScoresSnapshot["events"][number];

type Props = {
  events: MatchEvent[];
  homeTeam: string;
  awayTeam: string;
  penScore?: { home: number; away: number };
  lang?: AppLang;
};

const KIND_LABEL: Record<string, Record<AppLang, string>> = {
  goal: { en: "Goal", fr: "But", es: "Gol", de: "Tor", pt: "Gol", ru: "Гол", ja: "ゴール", zh: "进球" },
  card: {
    en: "Card",
    fr: "Carton",
    es: "Tarjeta",
    de: "Karte",
    pt: "Cartão",
    ru: "Карточка",
    ja: "カード",
    zh: "黄牌",
  },
  substitution: {
    en: "Sub",
    fr: "Changement",
    es: "Cambio",
    de: "Wechsel",
    pt: "Substituição",
    ru: "Замена",
    ja: "交代",
    zh: "换人",
  },
};

function eventKind(type: string): "goal" | "card" | "substitution" | "penalty" | "other" {
  if (type === "goal") return "goal";
  if (type.includes("card")) return "card";
  if (type.includes("substitution")) return "substitution";
  if (type === "penalty_goal" || type === "penalty_miss") return "penalty";
  return "other";
}

function eventIcon(type: string): string {
  const kind = eventKind(type);
  if (kind === "goal") return "⚽";
  if (kind === "card") return type.includes("red") ? "🟥" : "🟨";
  if (kind === "substitution") return "🔁";
  if (type === "penalty_goal") return "✓";
  if (type === "penalty_miss") return "✗";
  return "•";
}

function kindLabel(type: string, lang: AppLang): string {
  if (type === "penalty_goal" || type === "penalty_miss") {
    return penaltyEventKindLabel(type, lang);
  }
  const kind = eventKind(type);
  const map = KIND_LABEL[kind];
  return map ? map[lang] : type;
}

function displayMinute(ev: MatchEvent, lang: AppLang): string {
  if (isShootoutEvent(ev)) return penaltyKickLabel(lang, shootoutKickIndex(ev));
  return ev.minute != null ? `${ev.minute}'` : "—";
}

function EventRow({
  ev,
  i,
  homeTeam,
  awayTeam,
  lang,
}: {
  ev: MatchEvent;
  i: number;
  homeTeam: string;
  awayTeam: string;
  lang: AppLang;
}) {
  const side = ev.team === "away" ? "away" : ev.team === "home" ? "home" : "neutral";
  const teamName = side === "away" ? awayTeam : side === "home" ? homeTeam : "";
  const kind = eventKind(ev.type);
  const shootout = isShootoutEvent(ev);
  return (
    <li
      key={`${ev.type}-${ev.minute ?? "x"}-${i}`}
      className={`goal-feed-row goal-feed-row--${side} goal-feed-row--${kind}${shootout ? " goal-feed-row--shootout" : ""}`}
    >
      <span className="goal-feed-minute">{displayMinute(ev, lang)}</span>
      <span className="goal-feed-icon" aria-hidden>
        {eventIcon(ev.type)}
      </span>
      <span className="goal-feed-text">
        <span className="goal-feed-team">{teamName ? teamShortLabel(teamName, lang) : "—"}</span>
        <span className="goal-feed-kind">{kindLabel(ev.type, lang)}</span>
        {ev.player ? <span className="goal-feed-player">{ev.player}</span> : null}
      </span>
    </li>
  );
}

/** Live match timeline: goals + cards ordered by minute, home left / away right. */
export function GoalFeed({
  events,
  homeTeam,
  awayTeam,
  penScore,
  lang = "en",
}: Props) {
  const ordered = [...events].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
  const regulation = ordered.filter((e) => !isShootoutEvent(e));
  const shootout = ordered.filter((e) => isShootoutEvent(e));
  const hasShootout = shootout.length > 0 || penScore != null;

  if (ordered.length === 0 && !hasShootout) return null;

  const sectionTitle = PENALTY_SECTION_TITLE[lang] ?? PENALTY_SECTION_TITLE.en;
  const sectionScore =
    penScore != null ? penaltyShootoutScore(lang, penScore.home, penScore.away) : sectionTitle;

  return (
    <div className="goal-feed-wrap">
      {regulation.length > 0 ? (
        <ul className="goal-feed">
          {regulation.map((ev, i) => (
            <EventRow key={`reg-${i}`} ev={ev} i={i} homeTeam={homeTeam} awayTeam={awayTeam} lang={lang} />
          ))}
        </ul>
      ) : null}
      {hasShootout ? (
        <div className="goal-feed-shootout">
          <p className="goal-feed-shootout-title" role="heading" aria-level={3}>
            <span className="goal-feed-shootout-icon" aria-hidden>
              🎯
            </span>
            {sectionScore}
          </p>
          {shootout.length > 0 ? (
            <ul className="goal-feed goal-feed--shootout">
              {shootout.map((ev, i) => (
                <EventRow
                  key={`pen-${i}`}
                  ev={ev}
                  i={i}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  lang={lang}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
