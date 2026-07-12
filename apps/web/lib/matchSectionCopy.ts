import type { AppLang } from "@/lib/locales";

export type SectionBlock = { title: string; body: string };

type LangBundle<T> = Record<AppLang, T>;

export function sectionCopyFor<T>(bundle: LangBundle<T>, lang: AppLang): T {
  return bundle[lang] ?? bundle.en;
}

const edgeSetup: LangBundle<SectionBlock> = {
  en: {
    title: "SETUP verdict",
    body: "Model vs Shin de-vig consensus — side, conviction tier, and market breakdown below.",
  },
  fr: {
    title: "Verdict SETUP",
    body: "Modele vs consensus Shin de-vig — cote, niveau de conviction et marche ci-dessous.",
  },
  es: {
    title: "Verdicto SETUP",
    body: "Modelo vs consenso Shin de-vig — lado, conviccion y desglose de mercado abajo.",
  },
  de: {
    title: "SETUP-Urteil",
    body: "Modell vs Shin de-vig Konsens — Seite, Ueberzeugung und Marktaufstellung unten.",
  },
  pt: {
    title: "Verdicto SETUP",
    body: "Modelo vs consenso Shin de-vig — lado, conviccao e mercado abaixo.",
  },
  ru: {
    title: "Verdikt SETUP",
    body: "Model vs Shin de-vig konsensus — storona, uverennost i rynok nizhe.",
  },
  ja: {
    title: "SETUP verdict",
    body: "モデル vs Shin de-vig コンセンサス — サイド・確信度・市場内訳は下記。",
  },
  zh: {
    title: "SETUP 判定",
    body: "模型 vs Shin de-vig 共识 — 方向、置信度与市场分解见下方。",
  },
};

const edgeHold: LangBundle<SectionBlock> = {
  en: {
    title: "HOLD verdict",
    body: "Fail-closed: edge too small or no odds. HOLD is a first-class decision.",
  },
  fr: {
    title: "Verdict HOLD",
    body: "Fail-closed : pas assez d edge ou cotes absentes. HOLD est une decision de premiere classe.",
  },
  es: {
    title: "Verdicto HOLD",
    body: "Fail-closed: edge insuficiente o sin cuotas. HOLD es decision de primera clase.",
  },
  de: {
    title: "HOLD-Urteil",
    body: "Fail-closed: Edge zu klein oder keine Quoten. HOLD ist Entscheidung erster Klasse.",
  },
  pt: {
    title: "Verdicto HOLD",
    body: "Fail-closed: edge insuficiente ou sem odds. HOLD e decisao de primeira classe.",
  },
  ru: {
    title: "Verdikt HOLD",
    body: "Fail-closed: malo edge ili net koeffitsientov. HOLD — reshenie pervogo klassa.",
  },
  ja: {
    title: "HOLD verdict",
    body: "Fail-closed: edge too small or no odds. HOLD is a first-class decision.",
  },
  zh: {
    title: "HOLD 判定",
    body: "Fail-closed：edge 过小或无赔率。HOLD 是一级决策。",
  },
};

const odds: LangBundle<SectionBlock> = {
  en: {
    title: "TxLINE 1X2 odds",
    body: "Public market consensus. Shin de-vig removes book margin to get pi_tx.",
  },
  fr: {
    title: "Cotes 1X2 TxLINE",
    body: "Consensus public du marche. La de-vig Shin retire la marge bookmaker.",
  },
  es: {
    title: "Cuotas 1X2 TxLINE",
    body: "Consenso publico del mercado. Shin de-vig quita margen bookmaker.",
  },
  de: {
    title: "TxLINE 1X2-Quoten",
    body: "Offentlicher Marktkonsens. Shin de-vig entfernt Bookmaker-Marge.",
  },
  pt: {
    title: "Odds 1X2 TxLINE",
    body: "Consenso publico do mercado. Shin de-vig remove margem bookmaker.",
  },
  ru: {
    title: "Koeffitsienty 1X2 TxLINE",
    body: "Publichnyy rynochnyy konsensus. Shin de-vig ubiraet marzhu bukmekera.",
  },
  ja: {
    title: "TxLINE 1X2 odds",
    body: "Public market consensus. Shin de-vig removes book margin.",
  },
  zh: {
    title: "TxLINE 1X2 赔率",
    body: "公开市场共识。Shin de-vig 去除庄家边际。",
  },
};

export const MATCH_SECTION_COPY = {
  edgeSetup,
  edgeHold,
  odds,
};
