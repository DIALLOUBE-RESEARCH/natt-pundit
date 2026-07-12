import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { Buffer } from "buffer";
import Head from "next/head";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { DocumentTitle } from "@/components/DocumentTitle";
import { PoweredByTxOdds } from "@/components/PoweredByTxOdds";
import { PresentProvider } from "@/components/present/PresentProvider";
import { AppShell } from "@/features/shell/AppShell";
import { AgentConnectOpenProvider } from "@/lib/agentConnectOpen";
import { stitchUiEnabled } from "@/lib/stitchUiFlag";
import { UI_ASSETS } from "@/lib/uiAssets";
import "@/styles/globals.css";
import "@/design-system/tokens/stitch-light.css";
import "@/design-system/tokens/stitch-dark.css";

const WalletProviders = dynamic(() => import("@/context/WalletProviders"), { ssr: false });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";

if (typeof globalThis !== "undefined" && !(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isSandbox = router.pathname === "/sandbox";
  const isPhantomReturn = router.pathname === "/wallet/phantom-return";
  const useStitchShell = stitchUiEnabled && !isSandbox && !isPhantomReturn;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta
          name="theme-color"
          content={isSandbox || useStitchShell ? "#ffffff" : "#141c32"}
        />
        {!isPhantomReturn && <link rel="manifest" href={`${basePath}/manifest.json`} />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Montserrat:wght@700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`:root{--ui-hero-bg:url('${UI_ASSETS.heroBg}');--ui-card-texture:url('${UI_ASSETS.cardTexture}');--ui-header-strip:url('${UI_ASSETS.headerStrip}');}`}</style>
      </Head>
      <PresentProvider>
        <AgentConnectOpenProvider>
          <DocumentTitle />
          <WalletProviders>
            {isSandbox || isPhantomReturn ? (
              <Component {...pageProps} />
            ) : useStitchShell ? (
              <AppShell>
                <Component {...pageProps} />
              </AppShell>
            ) : (
              <div className="app-shell">
                <AppHeader />
                <main className="app-main">
                  <Component {...pageProps} />
                </main>
                <PoweredByTxOdds />
              </div>
            )}
          </WalletProviders>
        </AgentConnectOpenProvider>
      </PresentProvider>
    </>
  );
}
