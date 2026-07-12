import type { Fixture, OddsLine, WcMatchFormat } from "@natt-pundit/contracts";
import { wcMatchFormat } from "@natt-pundit/natt-core/wcMatchRules";

/** Parimutuel escrow: draw outcome only in group stage (90-min 1X2). */
export function allowsDrawBetting(format: WcMatchFormat): boolean {
  return format === "group";
}

/** Fixture format from API or kickoff date (WC26 group ends 27 Jun 2026 UTC). */
export function resolveWcFormat(fixture: Pick<Fixture, "wcFormat" | "kickoffAt">): WcMatchFormat {
  return fixture.wcFormat ?? wcMatchFormat(fixture.kickoffAt);
}

/** Hide 90-min draw quotes in knockout — final issue is winner (ET / pens). */
export function filterOddsForWcFormat(odds: OddsLine[], format: WcMatchFormat): OddsLine[] {
  if (format === "group") return odds;
  return odds.filter((line) => {
    if (line.market.toUpperCase() !== "1X2") return true;
    return line.selection.toLowerCase() !== "draw";
  });
}
