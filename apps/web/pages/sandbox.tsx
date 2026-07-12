import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ContestLogo } from "@/components/TxOddsLogo";
import { LiquidGlassTabBar } from "@/design-system/glass/LiquidGlassTabBar";
import { StitchLiquidGlassFilter } from "@/design-system/glass/StitchLiquidGlassFilter";
import { StitchSandboxHeader } from "@/components/stitch/StitchSandboxHeader";
import { StitchDataLabPanel } from "@/components/stitch/panels/StitchDataLabPanel";
import { StitchDocsPanel } from "@/components/stitch/panels/StitchDocsPanel";
import { StitchHomePanel } from "@/components/stitch/panels/StitchHomePanel";
import { StitchWalletPanel } from "@/components/stitch/panels/StitchWalletPanel";
import { StitchMatchesPanel } from "@/components/stitch/panels/StitchMatchesPanel";
import { SUPER_TEAM_HACKATHON_URL } from "@/lib/brandLinks";
import { UI_ASSETS } from "@/lib/uiAssets";
import {
  readStoredStitchTab,
  STITCH_TABS,
  storeStitchTab,
  type StitchTabId,
} from "@/lib/stitchTabs";
import {
  applyStitchTheme,
  readStoredStitchTheme,
  storeStitchTheme,
  type StitchThemeMode,
} from "@/shared/theme/stitchTheme";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (process.env.NEXT_PUBLIC_NATT_STITCH_UI_ENABLED === "true") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(ctx.query)) {
      if (typeof value === "string") params.set(key, value);
      else if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    }
    const qs = params.toString();
    return { redirect: { destination: qs ? `/?${qs}` : "/", permanent: true } };
  }
  return { props: {} };
};

export default function SandboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StitchTabId>("home");
  const [themeMode, setThemeMode] = useState<StitchThemeMode>("light");
  const tabContentRef = useRef<HTMLDivElement>(null);
  const showOverlay = router.query.overlay === "1";

  useEffect(() => {
    document.documentElement.classList.add("sandbox-route");
    const storedTab = readStoredStitchTab();
    if (storedTab) setActiveTab(storedTab);
    const storedTheme = readStoredStitchTheme();
    if (storedTheme) setThemeMode(storedTheme);
    applyStitchTheme(storedTheme ?? "light");
    return () => {
      document.documentElement.classList.remove("sandbox-route");
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

  const selectTab = (id: StitchTabId) => {
    setActiveTab(id);
    storeStitchTab(id);
  };

  const showGrass = activeTab === "home" || activeTab === "matches";

  return (
    <>
      <Head>
        <title>Natt Settlement — Stitch Sandbox</title>
        <meta name="theme-color" content={themeMode === "dark" ? "#0b0f17" : "#ffffff"} />
      </Head>

      <div className="stitch-light-app">
        <StitchLiquidGlassFilter />

        {showOverlay && (
          <div
            className="stitch-mockup-overlay"
            style={{ backgroundImage: `url('${UI_ASSETS.stitchMockupOverlay}')` }}
            aria-hidden
          />
        )}

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

            {activeTab === "home" ? <StitchHomePanel onNavigateTab={selectTab} /> : null}
            {activeTab === "matches" ? <StitchMatchesPanel /> : null}
            {activeTab === "datalab" ? <StitchDataLabPanel /> : null}
            {activeTab === "docs" ? <StitchDocsPanel /> : null}
            {activeTab === "wallet" ? <StitchWalletPanel /> : null}
          </div>
        </div>

        <div className="stitch-tabbar-wrap">
          <LiquidGlassTabBar aria-label="Main navigation">
            {STITCH_TABS.map((tab) => {
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
                  {active && <span className="stitch-tabbar-dot" aria-hidden />}
                </button>
              );
            })}
          </LiquidGlassTabBar>
        </div>
      </div>

      <style jsx global>{`
        html.sandbox-route,
        html.sandbox-route body,
        html.sandbox-route #__next {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          -webkit-text-size-adjust: 100%;
        }

        html.sandbox-route body {
          overflow: hidden;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
          background: var(--stitch-light-page-bottom) !important;
          background-image: none !important;
          background-attachment: scroll !important;
        }
      `}</style>
    </>
  );
}
