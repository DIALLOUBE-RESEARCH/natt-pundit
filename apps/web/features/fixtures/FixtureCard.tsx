"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { TeamFlag } from "@/components/TeamFlag";
import { usePresent } from "@/components/present/PresentProvider";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { shell } from "@/lib/appShellI18n";
import { ui } from "@/lib/i18n";
import { stitchStadiumAssetForTheme } from "@/lib/uiAssets";
import { useStitchThemeMode } from "@/lib/useStitchThemeMode";
import type { StitchCardModel } from "@/lib/stitchCardModel";

type Props = {
  card: StitchCardModel;
  featured?: boolean;
  favorited?: boolean;
  onToggleFavorite?: (fixtureId: string) => void;
};

/** Stitch glass match card — canonical fixture surface (F92N). */
export function FixtureCard({ card, featured, favorited, onToggleFavorite }: Props) {
  const { lang } = usePresent();
  const s = shell(lang);
  const t = ui(lang);
  const themeMode = useStitchThemeMode();
  const stadiumBg = stitchStadiumAssetForTheme(card.stadiumAsset, themeMode);

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(card.fixtureId);
    e.currentTarget.blur();
  };

  return (
    <Link
      href={`/match/${card.fixtureId}`}
      className={featured ? "stitch-match-card-link stitch-match-card-link--featured" : "stitch-match-card-link"}
    >
      <article className={`stitch-match-card stitch-match-card--${card.glow}`}>
        <div
          className="stitch-card-stadium-bg"
          style={{ backgroundImage: `url('${stadiumBg}')` }}
          aria-hidden
        />
        <div className="stitch-card-inner">
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
            ) : (
              <span className="stitch-card-star" aria-hidden>
                ☆
              </span>
            )}
          </div>

          <div className="stitch-card-main">
            <div className="stitch-card-flags">
              <div className="stitch-flag-circle">
                <TeamFlag team={card.homeTeam} variant="circle" size="sm" />
              </div>
              <span className="stitch-vs">{t.matchVs}</span>
              <div className="stitch-flag-circle">
                <TeamFlag team={card.awayTeam} variant="circle" size="sm" />
              </div>
            </div>

            <div className="stitch-card-divider" aria-hidden />

            <div className="stitch-card-center">
              <span className="stitch-card-date">{card.kickoff}</span>
              <span className="stitch-card-score">{card.scoreOrTime}</span>
              {card.isLive ? (
                <span className="stitch-live-badge">{card.status}</span>
              ) : card.status ? (
                <span className="stitch-card-status">{card.status}</span>
              ) : null}
            </div>

            <div className="stitch-card-actions">
              {card.isFinished ? (
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
                  <LiquidGlassPill variant="bet">
                    <span>{t.pillBet}</span>
                    <span>→</span>
                  </LiquidGlassPill>
                  {!card.isLive ? (
                    <span className="stitch-upcoming">{t.statusUpcoming.toUpperCase()}</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** @deprecated Use FixtureCard — kept for stitch/ imports until F94N purge. */
export const StitchMatchCard = FixtureCard;
