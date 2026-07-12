import type { CommentaryEventType, CommentaryLang, CommentaryVars } from "./commentary_types.js";
import { COMMENTARY_LANGS } from "./commentary_types.js";

type TemplateFn = (v: CommentaryVars) => string;

function score(v: CommentaryVars): string {
  return `${v.scoreHome}-${v.scoreAway}`;
}

function teams(v: CommentaryVars): string {
  return `${v.homeTeam} ${v.scoreHome}, ${v.awayTeam} ${v.scoreAway}`;
}

const GOAL: Record<CommentaryLang, TemplateFn> = {
  en: (v) =>
    v.player
      ? `Goal! ${v.player} scores for ${v.team} in the ${v.minute}th minute. ${teams(v)}.`
      : `Goal for ${v.team}! Minute ${v.minute}. ${teams(v)}.`,
  fr: (v) =>
    v.player
      ? `But! ${v.player} marque pour ${v.team} a la ${v.minute}e minute. ${teams(v)}.`
      : `But pour ${v.team}! ${v.minute}e minute. ${teams(v)}.`,
  es: (v) =>
    v.player
      ? `Gol! ${v.player} marca para ${v.team} en el minuto ${v.minute}. ${teams(v)}.`
      : `Gol de ${v.team}! Minuto ${v.minute}. ${teams(v)}.`,
  zh: (v) =>
    v.player
      ? `${v.minute}分钟，${v.team}的${v.player}破门！${teams(v)}。`
      : `${v.minute}分钟，${v.team}进球！${teams(v)}。`,
  ja: (v) =>
    v.player
      ? `${v.minute}分、${v.team}の${v.player}が得点。${teams(v)}。`
      : `${v.minute}分、${v.team}が得点。${teams(v)}。`,
  ru: (v) =>
    v.player
      ? `Gol! ${v.player} zabivaet za ${v.team} na ${v.minute}-i minute. ${teams(v)}.`
      : `Gol ${v.team}! ${v.minute}-ya minuta. ${teams(v)}.`,
  pt: (v) =>
    v.player
      ? `Gol! ${v.player} marca para ${v.team} aos ${v.minute} minutos. ${teams(v)}.`
      : `Gol do ${v.team}! Minuto ${v.minute}. ${teams(v)}.`,
  de: (v) =>
    v.player
      ? `Tor! ${v.player} trifft fur ${v.team} in der ${v.minute}. Minute. ${teams(v)}.`
      : `Tor fur ${v.team}! ${v.minute}. Minute. ${teams(v)}.`,
};

const FULLTIME: Record<CommentaryLang, TemplateFn> = {
  en: (v) => `Full-time whistle. Final score: ${teams(v)}.`,
  fr: (v) => `Coup de sifflet final. Score: ${teams(v)}.`,
  es: (v) => `Final del partido. ${teams(v)}.`,
  zh: (v) => `比赛结束！最终比分 ${teams(v)}。`,
  ja: (v) => `試合終了。${teams(v)}。`,
  ru: (v) => `Konec matcha. ${teams(v)}.`,
  pt: (v) => `Fim de jogo. ${teams(v)}.`,
  de: (v) => `Abpfiff. Endergebnis ${teams(v)}.`,
};

const HALFTIME: Record<CommentaryLang, TemplateFn> = {
  en: (v) => `Half-time. ${teams(v)}.`,
  fr: (v) => `Mi-temps. ${teams(v)}.`,
  es: (v) => `Descanso. ${teams(v)}.`,
  zh: (v) => `半场结束，${teams(v)}。`,
  ja: (v) => `前半終了。${teams(v)}。`,
  ru: (v) => `Pereryv. ${teams(v)}.`,
  pt: (v) => `Intervalo. ${teams(v)}.`,
  de: (v) => `Halbzeit. ${teams(v)}.`,
};

const YELLOW_CARD: Record<CommentaryLang, TemplateFn> = {
  en: (v) => `Yellow card for ${v.player ?? v.team} (${v.team}).`,
  fr: (v) => `Carton jaune pour ${v.player ?? v.team} (${v.team}).`,
  es: (v) => `Tarjeta amarilla para ${v.player ?? v.team} (${v.team}).`,
  zh: (v) => `${v.team}${v.player ?? ""}黄牌。`,
  ja: (v) => `${v.team}の${v.player ?? ""}、イエローカード。`,
  ru: (v) => `Zheltaya kartochka ${v.player ?? v.team} (${v.team}).`,
  pt: (v) => `Cartao amarelo para ${v.player ?? v.team} (${v.team}).`,
  de: (v) => `Gelbe Karte fur ${v.player ?? v.team} (${v.team}).`,
};

const RED_CARD: Record<CommentaryLang, TemplateFn> = {
  en: (v) => `Red card! ${v.player ?? "Player"} sent off for ${v.team}.`,
  fr: (v) => `Carton rouge! ${v.player ?? "Joueur"} expulse (${v.team}).`,
  es: (v) => `Roja! ${v.player ?? "Jugador"} expulsado (${v.team}).`,
  zh: (v) => `红牌！${v.team}的${v.player ?? "球员"}被罚下。`,
  ja: (v) => `レッドカード！${v.team}の${v.player ?? "選手"}退場。`,
  ru: (v) => `Krasnaya kartochka! ${v.player ?? "Igrok"} udalen (${v.team}).`,
  pt: (v) => `Vermelho! ${v.player ?? "Jogador"} expulso (${v.team}).`,
  de: (v) => `Rot! ${v.player ?? "Spieler"} sieht Platzverweis (${v.team}).`,
};

const MATCH_KICKOFF: Record<CommentaryLang, TemplateFn> = {
  en: (v) => `Kick-off! ${v.homeTeam} versus ${v.awayTeam}.`,
  fr: (v) => `Coup d'envoi! ${v.homeTeam} contre ${v.awayTeam}.`,
  es: (v) => `Saque inicial! ${v.homeTeam} contra ${v.awayTeam}.`,
  zh: (v) => `开球！${v.homeTeam} 对 ${v.awayTeam}。`,
  ja: (v) => `キックオフ！${v.homeTeam}対${v.awayTeam}。`,
  ru: (v) => `Nachalo matcha! ${v.homeTeam} protiv ${v.awayTeam}.`,
  pt: (v) => `Pontape inicial! ${v.homeTeam} contra ${v.awayTeam}.`,
  de: (v) => `Anpfiff! ${v.homeTeam} gegen ${v.awayTeam}.`,
};

const EDGE_SETUP: Record<CommentaryLang, TemplateFn> = {
  en: (v) => `Natt edge alert: setup on ${v.edgeDirection ?? "market"}.`,
  fr: (v) => `Alerte Natt: setup detecte sur ${v.edgeDirection ?? "marche"}.`,
  es: (v) => `Alerta Natt: setup en ${v.edgeDirection ?? "mercado"}.`,
  zh: (v) => `Natt信号：${v.edgeDirection ?? "市场"}方向SETUP。`,
  ja: (v) => `Nattアラート：${v.edgeDirection ?? "市場"}でSETUP。`,
  ru: (v) => `Signal Natt: setup na ${v.edgeDirection ?? "rynok"}.`,
  pt: (v) => `Alerta Natt: setup em ${v.edgeDirection ?? "mercado"}.`,
  de: (v) => `Natt-Signal: Setup auf ${v.edgeDirection ?? "Markt"}.`,
};

const TEMPLATES: Partial<Record<CommentaryEventType, Record<CommentaryLang, TemplateFn>>> = {
  GOAL,
  GOAL_PENALTY: GOAL,
  FULLTIME,
  HALFTIME,
  YELLOW_CARD,
  RED_CARD,
  MATCH_KICKOFF,
  EDGE_SETUP,
};

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
}

export function renderCommentary(
  eventType: CommentaryEventType,
  lang: CommentaryLang,
  vars: CommentaryVars,
): string {
  const bundle = TEMPLATES[eventType];
  const fn = bundle?.[lang] ?? bundle?.en;
  if (!fn) {
    return collapseWhitespace(
      `${eventType} ${score(vars)} ${vars.homeTeam} ${vars.awayTeam}`,
    );
  }
  return collapseWhitespace(fn(vars));
}

export function isCommentaryLang(value: string): value is CommentaryLang {
  return (COMMENTARY_LANGS as readonly string[]).includes(value);
}
