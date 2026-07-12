import type { AppLang } from "@/lib/locales";

/** Short label for live badge / score parenthetical (8 langs). */
export const PENALTIES_LABEL: Record<AppLang, string> = {
  en: "Penalty shootout",
  fr: "Tirs au but",
  es: "Tanda de penales",
  de: "Elfmeterschießen",
  pt: "Disputa de penaltis",
  ru: "Серия пенальти",
  ja: "PK戦",
  zh: "点球大战",
};

/** Section header above shootout kicks in the timeline. */
export const PENALTY_SECTION_TITLE: Record<AppLang, string> = {
  en: "Penalty shootout",
  fr: "Séance de tirs au but",
  es: "Tanda de penales",
  de: "Elfmeterschießen",
  pt: "Disputa de penáltis",
  ru: "Серия пенальти",
  ja: "PK戦",
  zh: "点球大战",
};

export const PENALTY_SCORED: Record<AppLang, string> = {
  en: "Scored",
  fr: "Marqué",
  es: "Gol",
  de: "Getroffen",
  pt: "Gol",
  ru: "Забит",
  ja: "成功",
  zh: "打进",
};

export const PENALTY_MISSED: Record<AppLang, string> = {
  en: "Missed",
  fr: "Raté",
  es: "Fallado",
  de: "Verschossen",
  pt: "Perdido",
  ru: "Мимо",
  ja: "失敗",
  zh: "未进",
};

const PENALTY_KICK: Record<AppLang, string> = {
  en: "Kick",
  fr: "Tir",
  es: "Tiro",
  de: "Schuss",
  pt: "Cobrança",
  ru: "Удар",
  ja: "キック",
  zh: "第",
};

/** e.g. "Tir 3" / "Kick 3" / "第3球" */
export function penaltyKickLabel(lang: AppLang, kickIndex: number): string {
  if (lang === "zh") return `第${kickIndex}球`;
  if (lang === "ja") return `PK ${kickIndex}`;
  const word = PENALTY_KICK[lang] ?? PENALTY_KICK.en;
  return `${word} ${kickIndex}`;
}

/** e.g. "Tirs au but · 2-4" */
export function penaltyShootoutScore(
  lang: AppLang,
  home: number,
  away: number,
): string {
  const title = PENALTY_SECTION_TITLE[lang] ?? PENALTY_SECTION_TITLE.en;
  return `${title} · ${home}-${away}`;
}

export function isShootoutEvent(ev: { minute?: number; type: string }): boolean {
  return (
    ev.type === "penalty_goal" ||
    ev.type === "penalty_miss" ||
    (ev.minute != null && ev.minute > 120)
  );
}

export function shootoutKickIndex(ev: { minute?: number; type: string }): number {
  if (ev.minute != null && ev.minute > 120) return ev.minute - 120;
  return 1;
}

export function penaltyEventKindLabel(type: string, lang: AppLang): string {
  if (type === "penalty_goal") return PENALTY_SCORED[lang] ?? PENALTY_SCORED.en;
  if (type === "penalty_miss") return PENALTY_MISSED[lang] ?? PENALTY_MISSED.en;
  return type;
}
