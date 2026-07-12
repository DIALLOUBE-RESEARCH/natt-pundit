import { useEffect, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { ContestLogo } from "@/components/TxOddsLogo";
import { usePresent } from "@/components/present/PresentProvider";
import { StitchSandboxHeader } from "@/components/stitch/StitchSandboxHeader";
import { LiquidGlassTabBar } from "@/design-system/glass/LiquidGlassTabBar";
import { StitchLiquidGlassFilter } from "@/design-system/glass/StitchLiquidGlassFilter";
import { AppTabsProvider, useAppTabs } from "@/features/shell/AppTabsContext";
import { SUPER_TEAM_HACKATHON_URL } from "@/lib/brandLinks";
import { UI_ASSETS } from "@/lib/uiAssets";
import {
  applyStitchTheme,
  readStoredStitchTheme,
  storeStitchTheme,
  type StitchThemeMode,
} from "@/shared/theme/stitchTheme";
import { shell } from "@/lib/appShellI18n";

function StitchRouteStyles() {
  return (
    <style jsx global>{`
      html.stitch-route,
      html.stitch-route body,
      html.stitch-route #__next {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        overscroll-behavior: none;
        -webkit-text-size-adjust: 100%;
      }

      html.stitch-route body {
        overflow: hidden;
        touch-action: pan-y;
        -webkit-tap-highlight-color: transparent;
        background: var(--stitch-light-page-bottom) !important;
        background-image: none !important;
        background-attachment: scroll !important;
      }
    `}</style>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { activeTab, selectTab, showGrass, showTabBar, tabs } = useAppTabs();
  const { lang } = usePresent();
  const s = shell(lang);
  const [themeMode, setThemeMode] = useState<StitchThemeMode>("light");
  const tabContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("stitch-route");
    const storedTheme = readStoredStitchTheme();
    if (storedTheme) setThemeMode(storedTheme);
    applyStitchTheme(storedTheme ?? "light");
    return () => {
      document.documentElement.classList.remove("stitch-route");
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  useEffect(() => {
    applyStitchTheme(themeMode);
    storeStitchTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const el = tabContentRef.current;
    if (el) el.scrollTop = 0;
  }, [activeTab]);

  return (
    <>
      <Head>
        <meta name="theme-color" content={themeMode === "dark" ? "#0b0f17" : "#ffffff"} />
      </Head>

      <div className="stitch-light-app">
        <StitchLiquidGlassFilter />

        <div className="stitch-light-column stitch-light-column--sandbox">
          <StitchSandboxHeader themeMode={themeMode} onThemeChange={setThemeMode} />

          <div ref={tabContentRef} className="stitch-tab-content">
            {showGrass ? (
              <div className="stitch-top-stage stitch-top-stage--grass">
                <div className="stitch-light-hero stitch-light-hero--stage" aria-hidden>
                  <img src={UI_ASSETS.stitchLightHero} alt="" />
                  <div className="stitch-light-hero-fade" />
                </div>
                <div className="stitch-brand-zone stitch-brand-zone--shell">
                  <Link
                    href={SUPER_TEAM_HACKATHON_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stitch-brand-link"
                    aria-label="Superteam World Cup hackathon"
                  >
                    <ContestLogo height={64} className="stitch-brand-contest-logo" />
                  </Link>
                </div>
              </div>
            ) : null}

            {children}
          </div>
        </div>

        {showTabBar ? (
          <div className="stitch-tabbar-wrap">
            <LiquidGlassTabBar aria-label={s.ariaMainNav}>
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    className={`stitch-tabbar-item${active ? " stitch-tabbar-item--active" : ""}`}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                    <span>{tab.label}</span>
                    {active ? <span className="stitch-tabbar-dot" aria-hidden /> : null}
                  </button>
                );
              })}
            </LiquidGlassTabBar>
          </div>
        ) : null}
      </div>

      <StitchRouteStyles />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppTabsProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppTabsProvider>
  );
}
