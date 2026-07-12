import type { OddsLine } from "@natt-pundit/contracts";
import type { AppLang } from "@/lib/locales";
import { formatDecimal, pick1x2Lines } from "@/lib/formatOdds";
import { teamShortLabel } from "@/lib/teamDisplay";

export type Odds1x2Entry = {
  key: "home" | "draw" | "away";
  label: string;
  decimal: string;
  implied: number;
  isFavorite: boolean;
};

export function build1x2Entries(
  odds: OddsLine[],
  homeTeam: string,
  awayTeam: string,
  lang: AppLang,
  drawLabel: string,
  showDraw: boolean,
): Odds1x2Entry[] {
  const snapshot = pick1x2Lines(odds);
  const candidates: Array<{ key: "home" | "draw" | "away"; line?: OddsLine; label: string }> = [
    { key: "home", line: snapshot.home, label: teamShortLabel(homeTeam, lang) },
  ];
  if (showDraw && snapshot.draw) {
    candidates.push({ key: "draw", line: snapshot.draw, label: drawLabel });
  }
  candidates.push({ key: "away", line: snapshot.away, label: teamShortLabel(awayTeam, lang) });

  const entries: Odds1x2Entry[] = candidates
    .filter((row): row is typeof row & { line: OddsLine } => Boolean(row.line))
    .map((row) => ({
      key: row.key,
      label: row.label,
      implied: row.line.implied,
      decimal: formatDecimal(row.line.implied),
      isFavorite: false,
    }));

  if (entries.length === 0) return entries;

  const maxImplied = Math.max(...entries.map((entry) => entry.implied));
  const favorites = entries.filter((entry) => entry.implied === maxImplied);
  if (favorites.length === 1) {
    favorites[0].isFavorite = true;
  }

  return entries;
}

export function selectionDisplayLabel(
  selection: string,
  market: string,
  homeTeam: string | undefined,
  awayTeam: string | undefined,
  lang: AppLang,
  drawLabel: string,
): string {
  if (market.toUpperCase() !== "1X2" || !homeTeam || !awayTeam) {
    return selection.slice(0, 3).toUpperCase();
  }
  const key = selection.toLowerCase();
  if (key === "home") return teamShortLabel(homeTeam, lang);
  if (key === "away") return teamShortLabel(awayTeam, lang);
  if (key === "draw") return drawLabel;
  return selection.slice(0, 3).toUpperCase();
}
