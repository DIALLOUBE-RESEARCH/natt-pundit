import type { OddsLine } from "@natt-pundit/contracts";
import { formatDecimal, oddsDelta, tickerLabel } from "@/lib/formatOdds";

type Props = { odds: OddsLine[] };

export function OddsTicker({ odds }: Props) {
  if (odds.length === 0) {
    return (
      <div className="odds-ticker odds-ticker-empty">
        <span className="odds-ticker-label">TxLINE</span>
        <span className="odds-ticker-wait">Cotes en attente de publication…</span>
      </div>
    );
  }

  const items = odds.slice(0, 8);
  const track = [...items, ...items];

  return (
    <div className="odds-ticker">
      <span className="odds-ticker-label">LIVE ODDS</span>
      <div className="ticker-mask">
        <div className="ticker-track">
          {track.map((line, i) => {
            const delta = oddsDelta(line);
            const up = delta !== null && delta > 0;
            const down = delta !== null && delta < 0;
            return (
              <span
                key={`${line.selection}-${i}`}
                className={`ticker-item ${up ? "ticker-up" : ""} ${down ? "ticker-down" : ""}`}
              >
                {tickerLabel(line)}
                <em className="ticker-dec">{formatDecimal(line.implied)}</em>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
