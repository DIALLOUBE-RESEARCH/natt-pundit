import { createContext, useContext, type ReactNode } from "react";
import { useAppLocale } from "@/lib/useAppLocale";
import type { AppLang } from "@/lib/locales";

type PresentContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
};

const PresentContext = createContext<PresentContextValue>({
  lang: "en",
  setLang: () => {},
});

export function PresentProvider({ children }: { children: ReactNode }) {
  const { lang, setLang } = useAppLocale();
  return <PresentContext.Provider value={{ lang, setLang }}>{children}</PresentContext.Provider>;
}

export function usePresent(): PresentContextValue {
  return useContext(PresentContext);
}
