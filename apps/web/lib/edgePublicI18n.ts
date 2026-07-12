import type { ConsensusProbs, ConvictionTier, PublicEdgeVerdict } from "@natt-pundit/contracts";
import type { WcMatchFormat } from "@natt-pundit/contracts";
import type { AppLang } from "@/lib/locales";
import { outcomeLabel } from "@/lib/outcomeDiagnostic";
import { teamShortLabel } from "@/lib/teamDisplay";

type EdgePublicCopy = {
  convictionNone: string;
  convictionLow: string;
  convictionMedium: string;
  convictionHigh: string;
  holdPill: string;
  edgeSide: string;
  edgeConviction: string;
  edgeShinMarket: string;
  edgeModelSignal: string;
  setupSummary: (side: string, conviction: string) => string;
  holdSummary: string;
  consensusLine: (home: string, homePct: string, drawPart: string, away: string, awayPct: string) => string;
};

const COPY: Record<AppLang, EdgePublicCopy> = {
  en: {
    convictionNone: "none",
    convictionLow: "low",
    convictionMedium: "medium",
    convictionHigh: "high",
    holdPill: "No edge",
    edgeSide: "Side",
    edgeConviction: "Conviction",
    edgeShinMarket: "Shin market (de-vig)",
    edgeModelSignal: "Model vs market",
    setupSummary: (side, conviction) =>
      `Independent model disagrees with Shin consensus on ${side} (${conviction} conviction).`,
    holdSummary:
      "No outcome clears the net-edge threshold — model aligns with Shin consensus. HOLD is intentional.",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  fr: {
    convictionNone: "aucune",
    convictionLow: "faible",
    convictionMedium: "moyenne",
    convictionHigh: "forte",
    holdPill: "Pas d edge",
    edgeSide: "Cote",
    edgeConviction: "Conviction",
    edgeShinMarket: "Marche Shin (de-vig)",
    edgeModelSignal: "Modele vs marche",
    setupSummary: (side, conviction) =>
      `Le modele independant diverge du consensus Shin sur ${side} (conviction ${conviction}).`,
    holdSummary:
      "Aucun outcome ne depasse le seuil d edge net — le modele est aligne avec Shin. HOLD volontaire.",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  es: {
    convictionNone: "ninguna",
    convictionLow: "baja",
    convictionMedium: "media",
    convictionHigh: "alta",
    holdPill: "Sin edge",
    edgeSide: "Lado",
    edgeConviction: "Conviccion",
    edgeShinMarket: "Mercado Shin (de-vig)",
    edgeModelSignal: "Modelo vs mercado",
    setupSummary: (side, conviction) =>
      `El modelo independiente discrepa del consenso Shin en ${side} (conviccion ${conviction}).`,
    holdSummary:
      "Ningun outcome supera el umbral de edge neto — modelo alineado con Shin. HOLD intencional.",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  de: {
    convictionNone: "keine",
    convictionLow: "niedrig",
    convictionMedium: "mittel",
    convictionHigh: "hoch",
    holdPill: "Kein Edge",
    edgeSide: "Seite",
    edgeConviction: "Ueberzeugung",
    edgeShinMarket: "Shin-Markt (de-vig)",
    edgeModelSignal: "Modell vs Markt",
    setupSummary: (side, conviction) =>
      `Unabhaengiges Modell weicht vom Shin-Konsens bei ${side} ab (${conviction} Ueberzeugung).`,
    holdSummary:
      "Kein Outcome ueber Netto-Edge-Schwelle — Modell aligned mit Shin. HOLD beabsichtigt.",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  pt: {
    convictionNone: "nenhuma",
    convictionLow: "baixa",
    convictionMedium: "media",
    convictionHigh: "alta",
    holdPill: "Sem edge",
    edgeSide: "Lado",
    edgeConviction: "Conviccao",
    edgeShinMarket: "Mercado Shin (de-vig)",
    edgeModelSignal: "Modelo vs mercado",
    setupSummary: (side, conviction) =>
      `Modelo independente diverge do consenso Shin em ${side} (conviccao ${conviction}).`,
    holdSummary:
      "Nenhum outcome passa o limiar de edge liquido — modelo alinhado com Shin. HOLD intencional.",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  ru: {
    convictionNone: "net",
    convictionLow: "nizkaya",
    convictionMedium: "srednyaya",
    convictionHigh: "vysokaya",
    holdPill: "Net edge",
    edgeSide: "Storona",
    edgeConviction: "Uverennost",
    edgeShinMarket: "Rynok Shin (de-vig)",
    edgeModelSignal: "Model vs rynok",
    setupSummary: (side, conviction) =>
      `Nezavisimaya model raskhoditsya s konsensusom Shin na ${side} (${conviction} uverennost).`,
    holdSummary:
      "Ni odin outcome ne prevysil porog chistogo edge — model v soglasii s Shin. HOLD namerenno.",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  ja: {
    convictionNone: "なし",
    convictionLow: "低",
    convictionMedium: "中",
    convictionHigh: "高",
    holdPill: "edge なし",
    edgeSide: "サイド",
    edgeConviction: "確信度",
    edgeShinMarket: "Shin 市場 (de-vig)",
    edgeModelSignal: "モデル vs 市場",
    setupSummary: (side, conviction) =>
      `独立モデルが Shin コンセンサスと ${side} で不一致（確信度 ${conviction}）。`,
    holdSummary: "純 edge 閾値未満 — モデルは Shin と一致。HOLD は意図的。",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
  zh: {
    convictionNone: "无",
    convictionLow: "低",
    convictionMedium: "中",
    convictionHigh: "高",
    holdPill: "无 edge",
    edgeSide: "方向",
    edgeConviction: "置信度",
    edgeShinMarket: "Shin 市场 (de-vig)",
    edgeModelSignal: "模型 vs 市场",
    setupSummary: (side, conviction) =>
      `独立模型与 Shin 共识在 ${side} 上分歧（置信度 ${conviction}）。`,
    holdSummary: "无 outcome 超过净 edge 阈值 — 模型与 Shin 一致。HOLD 是有意决策。",
    consensusLine: (home, homePct, drawPart, away, awayPct) =>
      `${home} ${homePct}${drawPart} · ${away} ${awayPct}`,
  },
};

function copy(lang: AppLang): EdgePublicCopy {
  return COPY[lang] ?? COPY.en;
}

export function convictionTierLabel(tier: ConvictionTier, lang: AppLang): string {
  const c = copy(lang);
  switch (tier) {
    case "high":
      return c.convictionHigh;
    case "medium":
      return c.convictionMedium;
    case "low":
      return c.convictionLow;
    default:
      return c.convictionNone;
  }
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function setupPillValue(
  edge: Pick<PublicEdgeVerdict, "direction" | "conviction">,
  homeTeam: string,
  awayTeam: string,
  lang: AppLang,
): string {
  const side =
    edge.direction && edge.direction !== "none"
      ? teamShortLabel(outcomeLabel(edge.direction, homeTeam, awayTeam, lang), lang)
      : "—";
  const conviction = convictionTierLabel(edge.conviction, lang);
  return `${side} · ${conviction}`;
}

export function holdPillValue(lang: AppLang): string {
  return copy(lang).holdPill;
}

export function publicEdgeSummaryText(
  edge: Pick<PublicEdgeVerdict, "verdict" | "direction" | "conviction">,
  homeTeam: string,
  awayTeam: string,
  lang: AppLang,
): string {
  const c = copy(lang);
  if (edge.verdict !== "SETUP" || !edge.direction || edge.direction === "none") {
    return c.holdSummary;
  }
  const side = outcomeLabel(edge.direction, homeTeam, awayTeam, lang);
  const conviction = convictionTierLabel(edge.conviction, lang);
  return c.setupSummary(side, conviction);
}

export function formatShinConsensusLine(
  consensus: ConsensusProbs,
  homeTeam: string,
  awayTeam: string,
  wcFormat: WcMatchFormat,
  lang: AppLang,
): string {
  const c = copy(lang);
  const home = teamShortLabel(homeTeam, lang);
  const away = teamShortLabel(awayTeam, lang);
  const homePct = pct(consensus.home);
  const awayPct = pct(consensus.away);
  const drawPart =
    wcFormat !== "knockout" && consensus.draw != null
      ? ` · ${lang === "fr" ? "Nul" : lang === "es" ? "Empate" : lang === "de" ? "Remis" : lang === "pt" ? "Empate" : lang === "ru" ? "Nichya" : lang === "ja" ? "分" : lang === "zh" ? "平" : "Draw"} ${pct(consensus.draw)}`
      : "";
  return c.consensusLine(home, homePct, drawPart, away, awayPct);
}

export function edgePublicLabels(lang: AppLang) {
  return copy(lang);
}
