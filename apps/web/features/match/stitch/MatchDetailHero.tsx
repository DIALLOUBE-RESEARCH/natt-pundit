"use client";

import type { MouseEvent } from "react";
import { TeamFlag } from "@/components/TeamFlag";
import { usePresent } from "@/components/present/PresentProvider";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { shell } from "@/lib/appShellI18n";
import { ui } from "@/lib/i18n";
import type { StitchCardModel } from "@/lib/stitchCardModel";
import { teamShortLabel } from "@/lib/teamDisplay";
import { FINISHED_LABEL, LIVE_TAG, PENALTIES_LABEL } from "@/lib/matchStatus";
import { penaltyShootoutScore } from "@/lib/penaltyI18n";
import { stitchStadiumAssetForTheme } from "@/lib/uiAssets";
import { useStitchThemeMode } from "@/lib/useStitchThemeMode";
import { StitchMatchCountdown } from "@/features/match/stitch/StitchMatchCountdown";
import { MatchDetailOddsPill } from "@/features/match/stitch/MatchDetailOddsPill";
import type { Fixture, OddsLine } from "@natt-pundit/contracts";
import { resolveWcFormat } from "@/lib/wcMatchRules";

type Props = {
  card: StitchCardModel;
  fixture: Fixture;
  odds: OddsLine[];
  competition: string;
  favorited?: boolean;
  onToggleFavorite?: (fixtureId: string) => void;
  live: boolean;
  finished: boolean;
  phasePen: boolean;
  homeWin: boolean;
  awayWin: boolean;
  statusHint: string;
  penScore?: { home: number; away: number } | null;
};

export function MatchDetailHero({
  card,
  fixture,
  odds,
  competition,
  favorited,
  onToggleFavorite,
  live,
  finished,
  phasePen,
  homeWin,
  awayWin,
  statusHint,
  penScore,
}: Props) {
  const { lang } = usePresent();
  const s = shell(lang);
  const t = ui(lang);
  const themeMode = useStitchThemeMode();
  const stadiumBg = stitchStadiumAssetForTheme(card.stadiumAsset, themeMode);
  const score = fixture.score;
  const wcFormat = resolveWcFormat(fixture);

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    onToggleFavorite?.(card.fixtureId);
    e.currentTarget.blur();
  };

  return (
    <article className={`stitch-match-card stitch-match-card--detail stitch-match-card--${card.glow}`}>
      <div
        className="stitch-card-stadium-bg"
        style={{ backgroundImage: `url('${stadiumBg}')` }}
        aria-hidden
      />
      <div className="stitch-card-inner stitch-match-detail-inner">
        <div className="stitch-card-header">
          <span className="stitch-card-stadium truncate">{card.stadiumName}</span>
          {onToggleFavorite ? (
            <button
              type="button"
              className={`stitch-card-star${favorited ? " stitch-card-star--active" : ""}`}
              aria-label={favorited ? s.favoriteRemove : s.favoriteAdd}
              aria-pressed={favorited ?? false}
              onClick={handleFavoriteClick}
            >
              {favorited ? "★" : "☆"}
            </button>
          ) : null}
        </div>

        <p className="stitch-match-detail-competition">{competition}</p>

        <div className="stitch-match-detail-teams">
          <div
            className={`stitch-match-detail-team stitch-match-detail-team--home${awayWin ? " stitch-match-detail-team--muted" : ""}`}
          >
            <div className="stitch-match-detail-team-stack">
              <div className="stitch-flag-circle stitch-flag-circle--detail">
                <TeamFlag team={card.homeTeam} variant="circle" size="lg" muted={awayWin} />
              </div>
              <span className="stitch-match-detail-team-label">{teamShortLabel(card.homeTeam, lang)}</span>
            </div>
          </div>

          <div className="stitch-match-detail-center">
            {phasePen ? (
              <span className="stitch-match-detail-live stitch-match-detail-live--pen">
                {PENALTIES_LABEL[lang]}
                {penScore ? ` ${penScore.home}-${penScore.away}` : ""}
              </span>
            ) : live ? (
              <span className="stitch-match-detail-live">
                <span className="stitch-live-badge-dot" aria-hidden />
                {LIVE_TAG[lang]}
                {statusHint ? ` · ${statusHint}` : ""}
              </span>
            ) : finished ? (
              <span className="stitch-match-detail-ft">✓ {FINISHED_LABEL[lang]}</span>
            ) : null}

            <span className="stitch-card-date">{card.kickoff}</span>
            <span
              className={`stitch-match-detail-score${homeWin ? " stitch-match-detail-score--home-win" : ""}${awayWin ? " stitch-match-detail-score--away-win" : ""}`}
            >
              {score ? (
                <>
                  <span className={homeWin ? "stitch-score-win" : awayWin ? "stitch-score-lose" : ""}>
                    {score.home}
                  </span>
                  <span className="stitch-score-sep"> - </span>
                  <span className={awayWin ? "stitch-score-win" : homeWin ? "stitch-score-lose" : ""}>
                    {score.away}
                  </span>
                </>
              ) : (
                card.scoreOrTime
              )}
            </span>

            {finished && penScore ? (
              <p className="stitch-match-detail-pen-note">
                {penaltyShootoutScore(lang, penScore.home, penScore.away)}
              </p>
            ) : null}

            {card.isLive && card.status ? (
              <span className="stitch-live-badge">{card.status}</span>
            ) : null}
          </div>

          <div
            className={`stitch-match-detail-team stitch-match-detail-team--away${homeWin ? " stitch-match-detail-team--muted" : ""}`}
          >
            <div className="stitch-match-detail-team-stack">
              <div className="stitch-flag-circle stitch-flag-circle--detail">
                <TeamFlag team={card.awayTeam} variant="circle" size="lg" muted={homeWin} />
              </div>
              <span className="stitch-match-detail-team-label">{teamShortLabel(card.awayTeam, lang)}</span>
            </div>
          </div>
        </div>

        {!live && !finished ? (
          <div className="stitch-match-detail-countdown-wrap">
            <StitchMatchCountdown
              kickoffAt={fixture.kickoffAt}
              status={fixture.status}
              lang={lang}
            />
          </div>
        ) : null}

        <div className="stitch-match-detail-actions">
          {finished ? (
            <LiquidGlassPill as="div" variant="finished">
              <span className="stitch-lg-pill-val">{t.badgeFinished}</span>
            </LiquidGlassPill>
          ) : (
            <>
              {card.isSetup ? (
                <LiquidGlassPill as="div" variant="setup">
                  <span className="stitch-lg-pill-val">{t.verdictSetup}</span>
                </LiquidGlassPill>
              ) : (
                <LiquidGlassPill as="div" variant="hold">
                  <span className="stitch-lg-pill-val">{t.verdictHold}</span>
                </LiquidGlassPill>
              )}
              <MatchDetailOddsPill
                odds={odds}
                homeTeam={card.homeTeam}
                awayTeam={card.awayTeam}
                lang={lang}
                wcFormat={wcFormat}
              />
              {!card.isLive ? (
                <span className="stitch-upcoming">{t.statusUpcoming.toUpperCase()}</span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
