import type { Fixture, MatchClock } from "@natt-pundit/contracts";
import type { ui } from "@/lib/i18n";
import type { AppLang } from "@/lib/locales";
import { PENALTIES_LABEL } from "@/lib/penaltyI18n";

export { PENALTIES_LABEL };

export const LIVE_TAG: Record<AppLang, string> = {
  en: "LIVE",
  fr: "DIRECT",
  es: "EN VIVO",
  de: "LIVE",
  pt: "AO VIVO",
  ru: "LIVE",
  ja: "LIVE",
  zh: "直播",
};

export const HALFTIME_LABEL: Record<AppLang, string> = {
  en: "HALF-TIME",
  fr: "MI-TEMPS",
  es: "DESCANSO",
  de: "HALBZEIT",
  pt: "INTERVALO",
  ru: "PERERYV",
  ja: "ハーフタイム",
  zh: "中场",
};

export const EXTRA_TIME_LABEL: Record<AppLang, string> = {
  en: "EXTRA TIME",
  fr: "PROLONGATIONS",
  es: "PRORROGA",
  de: "VERLÄNGERUNG",
  pt: "PRORROGACAO",
  ru: "DOP. VREMYA",
  ja: "延長",
  zh: "加时",
};

export const FINISHED_LABEL: Record<AppLang, string> = {
  en: "FULL-TIME",
  fr: "TERMINE",
  es: "FINAL",
  de: "ENDE",
  pt: "ENCERRADO",
  ru: "ZAVERSHEN",
  ja: "試合終了",
  zh: "完场",
};

/** Google-style live indicator: "46'", "MI-TEMPS", "TERMINE" or "A VENIR". */
export function liveIndicator(
  status: Fixture["status"],
  clock: MatchClock | undefined,
  t: ReturnType<typeof ui>,
  lang: AppLang,
): string {
  if (clock?.phase === "PEN") return PENALTIES_LABEL[lang];
  if (status === "finished") return FINISHED_LABEL[lang];
  if (clock?.phase === "HT") return HALFTIME_LABEL[lang];
  if (status === "live") {
    if (clock?.phase === "ET") return EXTRA_TIME_LABEL[lang];
    if (
      clock?.minute !== undefined &&
      (clock.phase === "1H" || clock.phase === "2H")
    ) {
      return `${clock.minute}'`;
    }
    return t.statusLive;
  }
  return t.statusUpcoming;
}
