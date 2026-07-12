"use client";

import Head from "next/head";
import { usePresent } from "@/components/present/PresentProvider";
import { ui } from "@/lib/i18n";

export function DocumentTitle() {
  const { lang } = usePresent();
  const title = ui(lang).homeTitle;
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
}
