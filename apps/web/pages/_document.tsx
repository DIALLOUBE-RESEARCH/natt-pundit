import { Head, Html, Main, NextScript } from "next/document";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="apple-touch-icon" href={`${basePath}/logo-natt-pundit.svg`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Natt Pundit" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
