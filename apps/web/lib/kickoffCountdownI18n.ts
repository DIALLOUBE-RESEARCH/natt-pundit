import type { AppLang } from "@/lib/locales";

export type KickoffCountdownCopy = {
  label: string;
  scheduledAt: string;
  startingSoon: string;
  unitDays: string;
  unitHours: string;
  unitMinutes: string;
  unitSeconds: string;
};

const en: KickoffCountdownCopy = {
  label: "Kickoff in",
  scheduledAt: "Scheduled",
  startingSoon: "Kickoff imminent",
  unitDays: "Days",
  unitHours: "Hrs",
  unitMinutes: "Min",
  unitSeconds: "Sec",
};

export const KICKOFF_COUNTDOWN_COPY: Record<AppLang, KickoffCountdownCopy> = {
  en,
  fr: {
    label: "Coup d'envoi dans",
    scheduledAt: "Programme",
    startingSoon: "Coup d'envoi imminent",
    unitDays: "J",
    unitHours: "H",
    unitMinutes: "Min",
    unitSeconds: "Sec",
  },
  es: {
    label: "Inicio en",
    scheduledAt: "Programado",
    startingSoon: "Inicio inminente",
    unitDays: "D",
    unitHours: "H",
    unitMinutes: "Min",
    unitSeconds: "Seg",
  },
  de: {
    label: "Anpfiff in",
    scheduledAt: "Geplant",
    startingSoon: "Anpfiff steht bevor",
    unitDays: "T",
    unitHours: "Std",
    unitMinutes: "Min",
    unitSeconds: "Sek",
  },
  pt: {
    label: "Inicio em",
    scheduledAt: "Agendado",
    startingSoon: "Inicio iminente",
    unitDays: "D",
    unitHours: "H",
    unitMinutes: "Min",
    unitSeconds: "Seg",
  },
  ru: {
    label: "Do nachala",
    scheduledAt: "Po raspisaniyu",
    startingSoon: "Skoro nachalo",
    unitDays: "D",
    unitHours: "Ch",
    unitMinutes: "Min",
    unitSeconds: "Sek",
  },
  ja: {
    label: "Kickoff in",
    scheduledAt: "Scheduled",
    startingSoon: "Starting soon",
    unitDays: "Days",
    unitHours: "Hrs",
    unitMinutes: "Min",
    unitSeconds: "Sec",
  },
  zh: {
    label: "距开赛",
    scheduledAt: "预定时间",
    startingSoon: "即将开赛",
    unitDays: "天",
    unitHours: "时",
    unitMinutes: "分",
    unitSeconds: "秒",
  },
};

export function kickoffCountdownCopy(lang: AppLang): KickoffCountdownCopy {
  return KICKOFF_COUNTDOWN_COPY[lang] ?? en;
}
