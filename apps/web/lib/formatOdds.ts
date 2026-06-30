import type { OddsLine } from "@natt-pundit/contracts";

export function impliedToDecimal(implied: number): number {
  if (implied <= 0) return 0;
  return 1 / implied;
}

export function formatDecimal(implied: number): string {
  const d = impliedToDecimal(implied);
  if (d <= 0) return "—";
  return d.toFixed(2);
}

export function oddsDelta(line: OddsLine): number | null {
  if (line.openImplied === undefined) return null;
  const open = impliedToDecimal(line.openImplied);
  const live = impliedToDecimal(line.implied);
  return live - open;
}

export function tickerLabel(line: OddsLine): string {
  const code = line.selection.slice(0, 3).toUpperCase();
  const dec = formatDecimal(line.implied);
  const delta = oddsDelta(line);
  if (delta === null || Math.abs(delta) < 0.01) {
    return `${code} ${dec}`;
  }
  const arrow = delta > 0 ? "▲" : "▼";
  return `${code} ${dec} ${arrow}${Math.abs(delta).toFixed(2)}`;
}
