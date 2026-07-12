import type { AppLang } from "@/lib/locales";
import { teamNameKey } from "@/lib/countryFlags";
import { teamLabel } from "@/lib/teamI18n";

const SHORT_OVERRIDES: Record<string, Partial<Record<AppLang, string>>> = {
  "united states": { en: "USA", fr: "USA", es: "EE.UU.", de: "USA", pt: "EUA", ru: "США", ja: "米国", zh: "美国" },
  "south korea": { en: "Korea", fr: "Coree", es: "Corea", de: "Korea", pt: "Coreia", ru: "Корея", ja: "韓国", zh: "韩国" },
  "bosnia and herzegovina": { en: "Bosnia", fr: "Bosnie", es: "Bosnia", de: "Bosnien", pt: "Bosnia", ru: "Босния", ja: "ボスニア", zh: "波黑" },
  "cote divoire": { en: "Ivory Coast", fr: "Cote d'Ivoire", es: "Costa Marfil", de: "Elfenbeink.", pt: "Costa Marfim", ru: "Кот-д'Ивуар", ja: "コートジボワール", zh: "科特迪瓦" },
  "saudi arabia": { en: "Saudi", fr: "Arabie sa.", es: "Arabia S.", de: "Saudi-Ar.", pt: "Arabia S.", ru: "Саудия", ja: "サウジ", zh: "沙特" },
  "united arab emirates": { en: "UAE", fr: "EAU", es: "EAU", de: "VAE", pt: "EAU", ru: "ОАЭ", ja: "UAE", zh: "阿联酋" },
};

function shortOverrideKey(team: string): string | null {
  const n = teamNameKey(team);
  if (SHORT_OVERRIDES[n]) return n;
  if (n.includes("united states") || n === "usa") return "united states";
  if (n.includes("korea")) return "south korea";
  return null;
}

/** Localized full team name. */
export function teamDisplayName(team: string, lang: AppLang): string {
  return teamLabel(team, lang);
}

/** Short label under circular flag (Stitch fixture card). */
export function teamShortLabel(team: string, lang: AppLang = "en"): string {
  const overrideKey = shortOverrideKey(team);
  if (overrideKey) {
    const row = SHORT_OVERRIDES[overrideKey];
    return row?.[lang] ?? row?.en ?? teamLabel(team, lang);
  }
  const localized = teamLabel(team, lang);
  if (localized.length <= 12) return localized;
  const first = localized.split(/\s+/)[0];
  return first.length <= 12 ? first : first.slice(0, 10);
}
