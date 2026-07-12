import type { AppLang } from "@/lib/locales";
import { localeTag } from "@/lib/locales";

export function formatKickoff(iso: string, lang: AppLang = "en"): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(localeTag(lang), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function formatStatus(status: string, lang: AppLang = "en"): string {
  const t = uiStatus(status, lang);
  if (t) return t;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function uiStatus(status: string, lang: AppLang): string | null {
  if (status === "live") {
    const live: Record<AppLang, string> = {
      en: "Live",
      fr: "Live",
      es: "En vivo",
      de: "Live",
      pt: "Ao vivo",
      ru: "Live",
      ja: "Live",
      zh: "进行中",
    };
    return live[lang];
  }
  if (status === "scheduled") {
    const up: Record<AppLang, string> = {
      en: "Upcoming",
      fr: "A venir",
      es: "Proximo",
      de: "Bevorstehend",
      pt: "Em breve",
      ru: "Skoro",
      ja: "Upcoming",
      zh: "即将开始",
    };
    return up[lang];
  }
  return null;
}

/** Stitch card center: short localized date only (e.g. Mon, Jun 30 / lun. 30 juin). */
export function formatKickoffDate(iso: string, lang: AppLang = "en"): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(localeTag(lang), {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Stitch card center: 24h kickoff time only (e.g. 06:30, 13:00). */
export function formatKickoffTime(iso: string, lang: AppLang = "en"): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleTimeString(localeTag(lang), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
