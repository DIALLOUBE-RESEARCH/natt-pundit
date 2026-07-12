"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { escrowConnection } from "@/lib/nattEscrow";
import {
  consumePhantomReturnHref,
  consumePhantomSignFailure,
  emitPhantomSignComplete,
  handlePhantomMobilePageReturn,
} from "@/lib/phantomMobileDeeplink";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** If HyperNatt PWA stole the callback, bounce back into Chrome on Android. */
function navigatePreferBrowserTab(targetUrl: string): void {
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid && isStandaloneDisplay()) {
    const withoutScheme = targetUrl.replace(/^https?:\/\//, "");
    const intent = `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;
    window.location.href = intent;
    return;
  }
  window.location.replace(targetUrl);
}

/** Phantom HTTPS redirect lands here (browser tab) — not the HyperNatt PWA shell. */
export function PhantomReturnClient() {
  const [message, setMessage] = useState("Connexion wallet…");

  useEffect(() => {
    void (async () => {
      const result = await handlePhantomMobilePageReturn(escrowConnection());
      if (result.type === "connect") {
        window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
        const returnHref = consumePhantomReturnHref() ?? BASE_PATH;
        navigatePreferBrowserTab(returnHref);
        return;
      }
      if (result.type === "sign" && result.signResult) {
        emitPhantomSignComplete(result.signResult);
        const returnHref = result.signResult.returnPath.startsWith("http")
          ? result.signResult.returnPath
          : `${window.location.origin}${result.signResult.returnPath}`;
        navigatePreferBrowserTab(returnHref);
        return;
      }
      if (result.type === "error") {
        const failure = consumePhantomSignFailure();
        const detail = failure?.message ?? result.error ?? "phantom_rejected";
        const isSign =
          new URLSearchParams(window.location.search).get("phantom_cb") === "signTransaction";
        setMessage(
          isSign ? `Transaction echouee: ${detail}` : `Connexion annulee: ${detail}`,
        );
        window.setTimeout(() => {
          const href = consumePhantomReturnHref() ?? BASE_PATH;
          navigatePreferBrowserTab(href.startsWith("http") ? href : `${window.location.origin}${href}`);
        }, 2500);
        return;
      }
      window.location.replace(BASE_PATH);
    })();
  }, []);

  return (
    <>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="no" />
        <meta name="mobile-web-app-capable" content="no" />
        <title>Wallet</title>
      </Head>
      <main
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <p>{message}</p>
      </main>
    </>
  );
}
