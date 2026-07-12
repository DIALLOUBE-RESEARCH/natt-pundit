import type { MouseEvent } from "react";
import type { Fixture, MatchClock } from "@natt-pundit/contracts";
import type { EdgeDisplayVerdict } from "@/lib/edgeDisplay";
import { displayConviction } from "@/lib/edgeDisplay";
import Link from "next/link";
import { TeamFlag } from "@/components/TeamFlag";
import { usePresent } from "@/components/present/PresentProvider";
import { formatKickoffDate, formatKickoffTime } from "@/lib/formatLocale";
import { ui } from "@/lib/i18n";
import { shell } from "@/lib/appShellI18n";
import { FINISHED_LABEL, liveIndicator } from "@/lib/matchStatus";
import { teamShortLabel } from "@/lib/teamDisplay";
import { escrowUiEnabled } from "@/lib/nattEscrow";
import { escrowBettableBeforeKickoff } from "@/lib/escrowUx";
import { escrowCopy } from "@/lib/escrowI18n";

type Props = {
  fixture: Fixture;
  featured?: boolean;
  edge?: EdgeDisplayVerdict;
  clock?: MatchClock;
  favorited?: boolean;
  onToggleFavorite?: (fixtureId: string) => void;
};

/** Stitch-validated horizontal bento row: flag | kickoff | flag + Setup pill right. */
export function MatchCard({ fixture, featured, edge, clock, favorited, onToggleFavorite }: Props) {
  const { lang } = usePresent();
  const t = ui(lang);
  const s = shell(lang);
  const live = fixture.status === "live";
  const finished = fixture.status === "finished";
  const setup = edge?.verdict === "SETUP";
  const escrowOn = escrowUiEnabled();
  const escrowOpen = escrowOn && escrowBettableBeforeKickoff(fixture.kickoffAt, fixture.status);
  const ec = escrowCopy(lang);

  // HOLD must not grey-out the card — only the verdict pill signals edge; card stays clickable.
  const muted = false;
  const verdictLabel = edge?.verdict ?? "HOLD";
  const conviction = displayConviction(edge);
  const edgeScore = conviction && conviction !== "none" ? 1 : 0;

  const stateClass = finished
    ? "match-card-finished"
    : setup
      ? "match-card-setup"
      : live
        ? "match-card-live-accent"
        : escrowOpen
          ? "match-card-escrow-open"
          : "match-card-upcoming";

  const showScore = (live || finished) && Boolean(fixture.score);
  const centerMain = showScore
    ? `${fixture.score!.home} - ${fixture.score!.away}`
    : formatKickoffTime(fixture.kickoffAt, lang);

  // Pro "result mode" for finished cards: winner highlighted, loser dimmed.
  const score = fixture.score;
  const homeWin = finished && !!score && score.home > score.away;
  const awayWin = finished && !!score && score.away > score.home;
  const homeMuted = finished ? awayWin : muted;
  const awayMuted = finished ? homeWin : muted;
  const sideClass = (win: boolean, m: boolean) =>
    ["match-card-side", win ? "match-card-side--win" : "", m ? "match-card-side-muted" : ""]
      .filter(Boolean)
      .join(" ");

  const statusHint = liveIndicator(fixture.status, clock, t, lang);

  const handleFavoriteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(fixture.fixtureId);
  };

  return (
    <Link
      href={`/match/${fixture.fixtureId}`}
      className={featured ? "match-card-link featured" : "match-card-link"}
    >
      <article
        className={[
          "match-card",
          "match-card--stitch",
          "glass-panel",
          live ? "glass-panel-live" : "",
          stateClass,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {onToggleFavorite ? (
          <button
            type="button"
            className={`match-card-favorite${favorited ? " match-card-favorite--active" : ""}`}
            aria-label={favorited ? s.favoriteRemove : s.favoriteAdd}
            aria-pressed={favorited ?? false}
            onClick={handleFavoriteClick}
          >
            {favorited ? "★" : "☆"}
          </button>
        ) : null}
        <div className="match-card-stitch-body">
          <div className="match-card-stitch-teams">
            <div className={sideClass(homeWin, homeMuted)}>
              <TeamFlag team={fixture.homeTeam} size="lg" variant="circle" muted={homeMuted} />
              <span className="match-card-team-label">{teamShortLabel(fixture.homeTeam)}</span>
            </div>
            <div className="match-card-center">
              <span className="match-card-date">{formatKickoffDate(fixture.kickoffAt, lang)}</span>
              {finished && score ? (
                <span className="match-card-kickoff match-card-score-final">
                  <span className={homeWin ? "msf-win" : awayWin ? "msf-lose" : "msf-draw"}>
                    {score.home}
                  </span>
                  <span className="msf-sep">-</span>
                  <span className={awayWin ? "msf-win" : homeWin ? "msf-lose" : "msf-draw"}>
                    {score.away}
                  </span>
                </span>
              ) : (
                <span className="match-card-kickoff">{centerMain}</span>
              )}
              {live ? (
                <span className="match-card-live-min">{statusHint}</span>
              ) : !finished ? (
                <span className="match-card-vs">{t.matchVs}</span>
              ) : null}
            </div>
            <div className={sideClass(awayWin, awayMuted)}>
              <TeamFlag team={fixture.awayTeam} size="lg" variant="circle" muted={awayMuted} />
              <span className="match-card-team-label">{teamShortLabel(fixture.awayTeam)}</span>
            </div>
          </div>
          <div className="match-card-stitch-action">
            {finished ? (
              <span className="match-card-verdict-pill match-card-verdict-finished">
                <span className="match-card-verdict-label">{FINISHED_LABEL[lang]}</span>
              </span>
            ) : (
              <span
                className={
                  setup
                    ? "match-card-verdict-pill match-card-verdict-setup"
                    : "match-card-verdict-pill match-card-verdict-hold"
                }
              >
                <span className="match-card-verdict-label">{verdictLabel}</span>
                <span className="match-card-verdict-score">{edgeScore.toFixed(3)}</span>
              </span>
            )}
            {escrowOpen ? (
              <span className="match-card-bet-cta">{ec.cardCta} →</span>
            ) : null}
            <span
              className={`match-card-status-hint${live || finished ? " match-card-status-hint-hidden" : ""}`}
            >
              {statusHint}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
