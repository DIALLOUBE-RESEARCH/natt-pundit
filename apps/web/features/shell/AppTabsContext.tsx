import { createContext, useContext, type ReactNode } from "react";
import { useAppTabsState, type AppTabsValue } from "@/features/shell/useAppTabs";

const AppTabsContext = createContext<AppTabsValue | null>(null);

export function AppTabsProvider({ children }: { children: ReactNode }) {
  const value = useAppTabsState();
  return <AppTabsContext.Provider value={value}>{children}</AppTabsContext.Provider>;
}

export function useAppTabs(): AppTabsValue {
  const ctx = useContext(AppTabsContext);
  if (!ctx) {
    throw new Error("useAppTabs requires AppTabsProvider");
  }
  return ctx;
}
