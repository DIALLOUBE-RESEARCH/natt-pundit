import type { OutcomeKey } from "@natt-pundit/contracts";
import type { AppLang } from "@/lib/locales";

const OUTCOME_LABEL: Record<OutcomeKey, { fr: string; en: string }> = {
  home: { fr: "Victoire domicile", en: "Home win" },
  draw: { fr: "Match nul", en: "Draw" },
  away: { fr: "Victoire exterieur", en: "Away win" },
};

function uiLang(lang: AppLang): "fr" | "en" {
  return lang === "fr" ? "fr" : "en";
}

export function outcomeLabel(
  outcome: OutcomeKey,
  homeTeam: string,
  awayTeam: string,
  lang: AppLang = "en",
): string {
  const l = uiLang(lang);
  if (outcome === "home") return homeTeam;
  if (outcome === "away") return awayTeam;
  return l === "en" ? "Draw" : "Match nul";
}

/** Diagnostic copy — edge signal, not a prediction. */
export function outcomeDiagnostic(
  outcome: OutcomeKey,
  edge: number,
  homeTeam: string,
  awayTeam: string,
  lang: AppLang = "en",
): string {
  const l = uiLang(lang);
  const pct = (Math.abs(edge) * 100).toFixed(1);
  const subject =
    outcome === "home"
      ? homeTeam
      : outcome === "away"
        ? awayTeam
        : OUTCOME_LABEL.draw[l];

  if (l === "en") {
    if (edge > 0) {
      return `Consensus underprices ${subject} by ${pct} pp (c − pi_tx).`;
    }
    if (edge < 0) {
      return `Consensus overprices ${subject} by ${pct} pp.`;
    }
    return `No measurable gap for ${subject}.`;
  }

  if (edge > 0) {
    if (outcome === "draw") {
      return `Le consensus sous-estime le match nul de ${pct} pts de probabilite (c − pi_tx).`;
    }
    return `Le consensus sous-estime ${subject} de ${pct} pts de probabilite (c − pi_tx).`;
  }
  if (edge < 0) {
    return `Le consensus sur-estime ${subject} de ${pct} pts de probabilite.`;
  }
  return `Pas d ecart mesurable sur ${subject}.`;
}
