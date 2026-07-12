import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import {
  readStoredStitchTab,
  stitchTabsForLang,
  storeStitchTab,
  type StitchTab,
  type StitchTabId,
} from "@/lib/stitchTabs";

const TAB_QUERY = "tab";

function tabFromRoute(
  pathname: string,
  query: Record<string, string | string[] | undefined>,
): StitchTabId | null {
  if (pathname === "/datas") return "datalab";
  if (pathname === "/") {
    const raw = query[TAB_QUERY];
    const tab = typeof raw === "string" ? raw : null;
    if (tab === "matches" || tab === "docs" || tab === "wallet") return tab;
    if (tab === "jury") return "wallet";
    return "home";
  }
  return null;
}

export type AppTabsValue = {
  activeTab: StitchTabId;
  selectTab: (id: StitchTabId) => void;
  showGrass: boolean;
  showTabBar: boolean;
  tabs: StitchTab[];
};

export function useAppTabsState(): AppTabsValue {
  const router = useRouter();
  const { lang } = usePresent();
  const tabs = useMemo(() => stitchTabsForLang(lang), [lang]);
  const routeTab = useMemo(
    () => (router.isReady ? tabFromRoute(router.pathname, router.query) : null),
    [router.isReady, router.pathname, router.query],
  );
  const [activeTab, setActiveTab] = useState<StitchTabId>("home");

  useEffect(() => {
    if (!router.isReady) return;
    if (routeTab) {
      setActiveTab(routeTab);
      storeStitchTab(routeTab);
      return;
    }
    const stored = readStoredStitchTab();
    if (stored) setActiveTab(stored);
  }, [router.isReady, routeTab]);

  const selectTab = useCallback(
    (id: StitchTabId) => {
      storeStitchTab(id);
      setActiveTab(id);
      if (id === "datalab") {
        void router.push("/datas");
      } else if (id === "home") {
        void router.push("/");
      } else {
        void router.push({ pathname: "/", query: { [TAB_QUERY]: id } });
      }
    },
    [router],
  );

  const showGrass =
    router.pathname === "/" && (activeTab === "home" || activeTab === "matches");
  const showTabBar = router.pathname !== "/sandbox";

  return {
    activeTab: routeTab ?? activeTab,
    selectTab,
    showGrass,
    showTabBar,
    tabs,
  };
}
