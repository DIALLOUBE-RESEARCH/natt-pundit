import type { OddsLine, WcMatchFormat } from "@natt-pundit/contracts";
import { formatDecimal, oddsDelta } from "@/lib/formatOdds";
import { selectionDisplayLabel } from "@/lib/odds1x2Display";
import { filterOddsForWcFormat } from "@/lib/wcMatchRules";
import { ui } from "@/lib/i18n";
import type { AppLang } from "@/lib/locales";

type Props = {
  odds: OddsLine[];
  scroll?: boolean;
  lang?: AppLang;
  homeTeam?: string;
  awayTeam?: string;
  wcFormat?: WcMatchFormat;
};

function tickerHumanLabel(
  line: OddsLine,
  homeTeam: string | undefined,
  awayTeam: string | undefined,
  lang: AppLang,
): string {
  const t = ui(lang);
  const label = selectionDisplayLabel(
    line.selection,
    line.market,
    homeTeam,
    awayTeam,
    lang,
    t.oddsDrawShort,
  );
  const delta = oddsDelta(line);
  const dec = formatDecimal(line.implied);
  if (delta === null || Math.abs(delta) < 0.01) {
    return `${label} ${dec}`;
  }
  const arrow = delta > 0 ? "▲" : "▼";
  return `${label} ${dec} ${arrow}${Math.abs(delta).toFixed(2)}`;
}

export function OddsTicker({
  odds,
  scroll = true,
  lang = "en",
  homeTeam,
  awayTeam,
  wcFormat = "group",
}: Props) {
  const t = ui(lang);
  const visibleOdds = filterOddsForWcFormat(odds, wcFormat);

  if (visibleOdds.length === 0) {
    return (
      <div className="odds-ticker odds-ticker-empty">
        <span className="odds-ticker-label">TxLINE</span>
        <span className="odds-ticker-wait">{t.oddsWaiting}</span>
      </div>
    );
  }

  const items = visibleOdds.slice(0, 8);
  const track = scroll ? [...items, ...items] : items;

  return (
    <div className="odds-ticker">
      <span className="odds-ticker-label">{t.liveOdds}</span>
      <div className={scroll ? "ticker-mask" : "ticker-static"}>
        <div className={scroll ? "ticker-track" : "ticker-static-row"}>
          {track.map((line, i) => {
            const delta = oddsDelta(line);
            const up = delta !== null && delta > 0;
            const down = delta !== null && delta < 0;
            return (
              <span
                key={`${line.selection}-${i}`}
                className={`ticker-item ${up ? "ticker-up" : ""} ${down ? "ticker-down" : ""}`}
              >
                {tickerHumanLabel(line, homeTeam, awayTeam, lang)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
