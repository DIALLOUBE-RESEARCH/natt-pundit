"use client";

import type { OddsLine, WcMatchFormat } from "@natt-pundit/contracts";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { ui } from "@/lib/i18n";
import { build1x2Entries } from "@/lib/odds1x2Display";
import { filterOddsForWcFormat } from "@/lib/wcMatchRules";
import type { AppLang } from "@/lib/locales";

type Props = {
  odds: OddsLine[];
  homeTeam: string;
  awayTeam: string;
  lang: AppLang;
  wcFormat: WcMatchFormat;
};

export function MatchDetailOddsPill({ odds, homeTeam, awayTeam, lang, wcFormat }: Props) {
  const t = ui(lang);
  const isKnockout = wcFormat === "knockout";
  const marketOdds = filterOddsForWcFormat(odds, wcFormat);
  const entries = build1x2Entries(
    marketOdds,
    homeTeam,
    awayTeam,
    lang,
    t.oddsDrawShort,
    !isKnockout,
  );
  const tag = isKnockout ? t.oddsWinnerTag : t.odds1x2Tag;
  const hint = isKnockout ? t.oddsMarketHintKnockout : t.oddsMarketHintGroup;

  if (entries.length === 0) {
    return (
      <div className="stitch-match-detail-odds-block">
        <LiquidGlassPill as="div" variant="bet" className="stitch-match-detail-odds-pill">
          <span>{tag}</span>
          <span className="stitch-match-detail-odds-wait">—</span>
        </LiquidGlassPill>
        <p className="stitch-match-detail-odds-hint">{hint}</p>
      </div>
    );
  }

  return (
    <div className="stitch-match-detail-odds-block">
      <LiquidGlassPill as="div" variant="bet" className="stitch-match-detail-odds-pill">
        <span className="stitch-match-detail-odds-tag">{tag}</span>
        <span className="stitch-match-detail-odds-values" aria-label={t.liveOdds}>
          {entries.map((entry, index) => (
            <span
              key={entry.key}
              className={`stitch-match-detail-odds-outcome${entry.isFavorite ? " stitch-match-detail-odds-outcome--favorite" : ""}`}
            >
              {index > 0 ? <span className="stitch-match-detail-odds-sep">·</span> : null}
              <span className="stitch-match-detail-odds-key">{entry.label}</span>
              <span className="stitch-match-detail-odds-dec">{entry.decimal}</span>
              {entry.isFavorite ? (
                <span className="stitch-match-detail-odds-fav">{t.oddsFavoriteTag}</span>
              ) : null}
            </span>
          ))}
        </span>
      </LiquidGlassPill>
      <p className="stitch-match-detail-odds-hint">{hint}</p>
    </div>
  );
}
