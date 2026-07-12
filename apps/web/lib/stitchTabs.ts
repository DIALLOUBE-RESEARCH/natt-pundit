import type { AppLang } from "@/lib/locales";
import { ui } from "@/lib/i18n";

export type StitchTabId = "home" | "matches" | "datalab" | "docs" | "wallet";

export type StitchTab = {
  id: StitchTabId;
  label: string;
  icon: string;
};

export const STITCH_TABS: StitchTab[] = [
  {
    id: "home",
    label: "Home",
    icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
  },
  {
    id: "matches",
    label: "Matches",
    icon: "M6.75 3v1.5M12 3v1.5m5.25-1.5v1.5M3 10.5h18M3 21h18M5.25 6h13.5A2.25 2.25 0 0121 8.25v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6z",
  },
  {
    id: "datalab",
    label: "DataLab",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.625c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.75v-5.625zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.125c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.625c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    id: "docs",
    label: "Docs",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: "M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v3",
  },
];

const TAB_LABEL_KEYS = {
  home: "tabHome",
  matches: "tabMatches",
  datalab: "tabDataLab",
  docs: "tabDocs",
  wallet: "tabWallet",
} as const satisfies Record<StitchTabId, keyof Pick<
  ReturnType<typeof ui>,
  "tabHome" | "tabMatches" | "tabDataLab" | "tabDocs" | "tabWallet"
>>;

export function stitchTabsForLang(lang: AppLang): StitchTab[] {
  const t = ui(lang);
  return STITCH_TABS.map((tab) => ({
    ...tab,
    label: t[TAB_LABEL_KEYS[tab.id]],
  }));
}

const STORAGE_KEY = "nattpundit.stitch.tab";

export function readStoredStitchTab(): StitchTabId | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === "home" || raw === "matches" || raw === "datalab" || raw === "docs" || raw === "wallet") {
    return raw;
  }
  if (raw === "jury") return "wallet";
  return null;
}

export function storeStitchTab(tab: StitchTabId): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, tab);
}
