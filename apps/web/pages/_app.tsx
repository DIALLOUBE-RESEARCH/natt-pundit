import type { AppProps } from "next/app";
import { Buffer } from "buffer";
import Head from "next/head";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import "@/styles/globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";

if (typeof globalThis !== "undefined" && !(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Natt Settlement</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A0A0F" />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="app-shell">
        <header className="app-header glass-panel">
          <div className="app-header-inner">
            <Link href="/" className="app-brand">
              <LogoMark size={36} />
              <span>Natt Settlement</span>
            </Link>
            <nav className="app-nav">
              <Link href="/">Fixtures</Link>
              <Link href="/activate" className="nav-txline">
                TxLINE
              </Link>
            </nav>
          </div>
        </header>
        <main className="app-main">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}
