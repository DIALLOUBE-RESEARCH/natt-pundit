import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  type AppLang,
  inferLocaleFromBrowser,
  isAppLang,
  LOCALE_STORAGE_KEY,
} from "@/lib/locales";

function readStoredLang(): AppLang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isAppLang(stored)) return stored;
  } catch {
    /* ignore */
  }
  return inferLocaleFromBrowser(navigator.language);
}

export function useAppLocale(): {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
} {
  const router = useRouter();
  const [lang, setLangState] = useState<AppLang>("en");

  useEffect(() => {
    const ql = router.query.lang;
    if (typeof ql === "string" && isAppLang(ql)) {
      setLangState(ql);
      return;
    }
    setLangState(readStoredLang());
  }, [router.query.lang]);

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return { lang, setLang };
}
