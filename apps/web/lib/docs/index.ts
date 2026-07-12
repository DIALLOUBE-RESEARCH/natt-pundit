import type { AppLang } from "@/lib/locales";
import type { DocsPack } from "./types";
import { deDocs } from "./locales/de";
import { enDocs } from "./locales/en";
import { esDocs } from "./locales/es";
import { frDocs } from "./locales/fr";
import { jaDocs } from "./locales/ja";
import { ptDocs } from "./locales/pt";
import { ruDocs } from "./locales/ru";
import { zhDocs } from "./locales/zh";

export type { DocBlock, DocSection, DocsPack } from "./types";

const BY_LANG: Record<AppLang, DocsPack> = {
  en: enDocs,
  fr: frDocs,
  es: esDocs,
  de: deDocs,
  pt: ptDocs,
  ru: ruDocs,
  ja: jaDocs,
  zh: zhDocs,
};

export function docsContent(lang: AppLang): DocsPack {
  return BY_LANG[lang] ?? BY_LANG.en;
}

/** @deprecated use docsContent(lang).sections */
export const DOCS_SECTIONS = enDocs.sections;
