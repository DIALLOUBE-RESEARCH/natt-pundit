/** Same locales + storage key as HyperNatt frontend (cross-app sync). */
export const LOCALE_STORAGE_KEY = "hypernatt_locale";

export const APP_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

export type AppLang = (typeof APP_LANGUAGES)[number]["code"];

export const SUPPORTED_LOCALES: AppLang[] = APP_LANGUAGES.map((l) => l.code);

export function isAppLang(value: string): value is AppLang {
  return SUPPORTED_LOCALES.includes(value as AppLang);
}

export function inferLocaleFromBrowser(browserLang: string): AppLang {
  if (!browserLang) return "en";
  const lower = browserLang.split("-")[0].toLowerCase();
  return isAppLang(lower) ? lower : "en";
}

/** BCP-47 tag for Intl date/time formatting. */
export function localeTag(lang: AppLang): string {
  const map: Record<AppLang, string> = {
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
    zh: "zh-CN",
    ja: "ja-JP",
    ru: "ru-RU",
    pt: "pt-BR",
    de: "de-DE",
  };
  return map[lang] ?? "en-US";
}
