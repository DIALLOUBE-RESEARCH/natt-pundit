import type { AppLang } from "@/lib/locales";
import type { BetLedgerStatus } from "@/lib/walletPortfolio";
import { teamLabel } from "@/lib/teamI18n";

export type WalletCopy = {
  kicker: string;
  title: string;
  lead: string;
  clusterDevnet: string;
  clusterMainnet: string;
  totalBalance: string;
  solBalance: string;
  usdcBalance: string;
  solUnavailable: string;
  usdcUnavailable: string;
  summaryOpen: string;
  summaryStaked: string;
  summaryRealizedPnl: string;
  summaryUnrealizedPnl: string;
  activityTitle: string;
  activityLead: string;
  activityEmpty: string;
  activityEmptyHint: string;
  activityExpandAll: string;
  activityCollapseAll: string;
  connectTitle: string;
  connectBody: string;
  connectCta: string;
  loading: string;
  syncFailed: string;
  refresh: string;
  colMatch: string;
  colPick: string;
  colStake: string;
  colStatus: string;
  colPnl: string;
  colReturn: string;
  pnlNet: (n: number) => string;
  summaryRecord: (won: number, lost: number) => string;
  viewMatch: string;
  actionCollect: string;
  actionClaim: string;
  actionSettle: string;
  actionRefund: string;
  actionWorking: string;
  statusOpen: string;
  statusClaimable: string;
  statusWon: string;
  statusLost: string;
  statusRefundEligible: string;
  statusRefunded: string;
  statusVoid: string;
  sideHome: string;
  sideDraw: string;
  sideAway: string;
  pnlPending: string;
  pnlEstimated: string;
  updatedAt: (time: string) => string;
};

const en: WalletCopy = {
  kicker: "Portfolio",
  title: "Wallet",
  lead: "Devnet balances and escrow bet history — shared pool betting, on-chain settlement.",
  clusterDevnet: "Solana Devnet",
  clusterMainnet: "Solana Mainnet",
  totalBalance: "Available balance",
  solBalance: "SOL",
  usdcBalance: "USDC",
  solUnavailable: "—",
  usdcUnavailable: "—",
  summaryOpen: "Open positions",
  summaryStaked: "Total staked",
  summaryRealizedPnl: "Realized P&L",
  summaryUnrealizedPnl: "Unrealized P&L",
  activityTitle: "Bet activity",
  activityLead: "World Cup pool bets by country. Collect payout here — even if the match left the fixtures list.",
  activityEmpty: "No bets yet",
  activityEmptyHint: "Place a pre-match escrow bet on any fixture, then return here.",
  activityExpandAll: "Show all bets",
  activityCollapseAll: "Show fewer",
  connectTitle: "Connect your wallet",
  connectBody: "Link a Solana wallet to view devnet balances and your escrow positions.",
  connectCta: "Connect wallet",
  loading: "Syncing portfolio…",
  syncFailed: "Could not load bet history. Retry.",
  refresh: "Refresh",
  colMatch: "Match",
  colPick: "Team",
  colStake: "Stake",
  colStatus: "Status",
  colPnl: "P&L",
  colReturn: "Return",
  pnlNet: (n) => `net P&L ${n >= 0 ? "+" : ""}${n.toFixed(2)}`,
  summaryRecord: (won, lost) => `${won}W · ${lost}L`,
  viewMatch: "View match",
  actionCollect: "Collect payout",
  actionClaim: "Claim winnings",
  actionSettle: "Settle pool",
  actionRefund: "Refund stake",
  actionWorking: "Signing…",
  statusOpen: "Open",
  statusClaimable: "Claimable",
  statusWon: "Won",
  statusLost: "Lost",
  statusRefundEligible: "Refund ready",
  statusRefunded: "Refunded",
  statusVoid: "—",
  sideHome: "Home",
  sideDraw: "Draw",
  sideAway: "Away",
  pnlPending: "—",
  pnlEstimated: "est.",
  updatedAt: (time) => `Updated ${time}`,
};

const fr: WalletCopy = {
  ...en,
  kicker: "Portefeuille",
  title: "Wallet",
  lead: "Soldes devnet et historique des paris escrow — pools a cagnotte partagee, settlement on-chain.",
  clusterDevnet: "Solana Devnet",
  clusterMainnet: "Solana Mainnet",
  totalBalance: "Solde disponible",
  summaryOpen: "Positions ouvertes",
  summaryStaked: "Total mise",
  summaryRealizedPnl: "P&L realise",
  summaryUnrealizedPnl: "P&L latent",
  activityTitle: "Activite paris",
  activityLead: "Paris CDM par pays (pool partage). Encaisse ici — meme si le match a quitte la liste.",
  activityEmpty: "Aucun pari",
  activityEmptyHint: "Mise escrow pre-match sur un match, puis reviens ici.",
  activityExpandAll: "Voir tout l'historique",
  activityCollapseAll: "Replier",
  connectTitle: "Connecte ton wallet",
  connectBody: "Lie un wallet Solana pour voir les soldes devnet et tes positions escrow.",
  connectCta: "Connecter wallet",
  loading: "Sync portefeuille…",
  syncFailed: "Historique des paris indisponible. Reessayer.",
  refresh: "Actualiser",
  colMatch: "Match",
  colPick: "Equipe",
  colStake: "Mise",
  colStatus: "Statut",
  colPnl: "P&L",
  colReturn: "Recu",
  pnlNet: (n) => `P&L net ${n >= 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}`,
  summaryRecord: (won, lost) => `${won}V · ${lost}D`,
  viewMatch: "Voir match",
  actionCollect: "Encaisser",
  actionClaim: "Reclamer gains",
  actionSettle: "Settler le pool",
  actionRefund: "Rembourser mise",
  actionWorking: "Signature…",
  statusOpen: "Ouvert",
  statusClaimable: "A reclamer",
  statusWon: "Gagne",
  statusLost: "Perdu",
  statusRefundEligible: "Remboursement",
  statusRefunded: "Rembourse",
  sideHome: "Domicile",
  sideDraw: "Nul",
  sideAway: "Exterieur",
  pnlEstimated: "est.",
  updatedAt: (time) => `Maj ${time}`,
};

const es: WalletCopy = {
  ...en,
  kicker: "Cartera",
  title: "Wallet",
  lead: "Saldos devnet e historial de apuestas escrow — pools de bote compartido, settlement on-chain.",
  totalBalance: "Saldo disponible",
  summaryOpen: "Posiciones abiertas",
  summaryStaked: "Total apostado",
  summaryRealizedPnl: "P&L realizado",
  summaryUnrealizedPnl: "P&L no realizado",
  activityTitle: "Actividad",
  activityLead: "Apuestas escrow en partidos del Mundial.",
  activityEmpty: "Sin apuestas",
  activityEmptyHint: "Apuesta escrow pre-partido en cualquier fixture.",
  activityExpandAll: "Ver todo el historial",
  activityCollapseAll: "Mostrar menos",
  connectTitle: "Conecta tu wallet",
  connectBody: "Enlaza un wallet Solana para ver saldos devnet y posiciones escrow.",
  connectCta: "Conectar wallet",
  loading: "Sincronizando…",
  syncFailed: "No se pudo cargar el historial. Reintentar.",
  refresh: "Actualizar",
  colMatch: "Partido",
  colPick: "Pick",
  colStake: "Apuesta",
  colStatus: "Estado",
  viewMatch: "Ver partido",
  statusOpen: "Abierta",
  statusClaimable: "Reclamable",
  statusWon: "Ganada",
  statusLost: "Perdida",
  statusRefundEligible: "Reembolso",
  statusRefunded: "Reembolsada",
  sideHome: "Local",
  sideDraw: "Empate",
  sideAway: "Visitante",
  updatedAt: (time) => `Actualizado ${time}`,
};

const de: WalletCopy = {
  ...en,
  kicker: "Portfolio",
  title: "Wallet",
  lead: "Devnet-Salden und Escrow-Wetthistorie — gemeinsame Pool-Wetten, On-Chain-Settlement.",
  totalBalance: "Verfugbares Guthaben",
  summaryOpen: "Offene Positionen",
  summaryStaked: "Gesamt eingesetzt",
  summaryRealizedPnl: "Realisierter P&L",
  summaryUnrealizedPnl: "Unrealisierter P&L",
  activityTitle: "Wettaktivitat",
  activityLead: "Escrow-Pool-Wetten uber WM-Spiele.",
  activityEmpty: "Noch keine Wetten",
  activityEmptyHint: "Pre-Match-Escrow-Wette auf ein Spiel platzieren.",
  activityExpandAll: "Alle Wetten anzeigen",
  activityCollapseAll: "Weniger anzeigen",
  connectTitle: "Wallet verbinden",
  connectBody: "Solana-Wallet verknupfen fur Devnet-Salden und Escrow-Positionen.",
  connectCta: "Wallet verbinden",
  loading: "Portfolio wird geladen…",
  syncFailed: "Wettverlauf konnte nicht geladen werden. Erneut versuchen.",
  refresh: "Aktualisieren",
  colMatch: "Spiel",
  colPick: "Tipp",
  colStake: "Einsatz",
  colStatus: "Status",
  viewMatch: "Spiel ansehen",
  statusOpen: "Offen",
  statusClaimable: "Auszahlbar",
  statusWon: "Gewonnen",
  statusLost: "Verloren",
  statusRefundEligible: "Erstattung",
  statusRefunded: "Erstattet",
  sideHome: "Heim",
  sideDraw: "Unentsch.",
  sideAway: "Auswarts",
  updatedAt: (time) => `Aktualisiert ${time}`,
};

const pt: WalletCopy = {
  ...en,
  kicker: "Carteira",
  title: "Wallet",
  lead: "Saldos devnet e historico de apostas escrow — pools de pote partilhado, settlement on-chain.",
  totalBalance: "Saldo disponivel",
  summaryOpen: "Posicoes abertas",
  summaryStaked: "Total apostado",
  summaryRealizedPnl: "P&L realizado",
  summaryUnrealizedPnl: "P&L nao realizado",
  activityTitle: "Atividade",
  activityLead: "Apostas escrow nos jogos do Mundial.",
  activityEmpty: "Sem apostas",
  activityEmptyHint: "Faca uma aposta escrow pre-jogo em qualquer fixture.",
  activityExpandAll: "Ver todo o historico",
  activityCollapseAll: "Mostrar menos",
  connectTitle: "Conecta a carteira",
  connectBody: "Liga uma carteira Solana para ver saldos devnet e posicoes escrow.",
  connectCta: "Conectar carteira",
  loading: "A sincronizar…",
  syncFailed: "Nao foi possivel carregar o historico. Tentar de novo.",
  refresh: "Atualizar",
  colMatch: "Jogo",
  colPick: "Escolha",
  colStake: "Aposta",
  colStatus: "Estado",
  viewMatch: "Ver jogo",
  statusOpen: "Aberta",
  statusClaimable: "A reclamar",
  statusWon: "Ganha",
  statusLost: "Perdida",
  statusRefundEligible: "Reembolso",
  statusRefunded: "Reembolsada",
  sideHome: "Casa",
  sideDraw: "Empate",
  sideAway: "Fora",
  updatedAt: (time) => `Atualizado ${time}`,
};

const ru: WalletCopy = {
  ...en,
  kicker: "Portfel",
  title: "Wallet",
  lead: "Balansy devnet i istoriya stavok escrow — obshchie pool-stavki, on-chain settlement.",
  totalBalance: "Dostupnyy balans",
  summaryOpen: "Otkrytye pozitsii",
  summaryStaked: "Vsego v stavke",
  summaryRealizedPnl: "Realizovannyy P&L",
  summaryUnrealizedPnl: "Nerealizovannyy P&L",
  activityTitle: "Istoriya stavok",
  activityLead: "Escrow stavki na matchi Chempionata mira.",
  activityEmpty: "Stavok poka net",
  activityEmptyHint: "Sdelay escrow stavku do nachala matcha.",
  activityExpandAll: "Pokazat vse stavki",
  activityCollapseAll: "Svernut",
  connectTitle: "Podklyuchi koshelek",
  connectBody: "Podklyuchi Solana koshelek dlya balansov devnet i pozitsiy escrow.",
  connectCta: "Podklyuchit",
  loading: "Sinkhronizatsiya…",
  syncFailed: "Ne udalos zagruzit istoriyu stavok. Povtorit.",
  refresh: "Obnovit",
  colMatch: "Match",
  colPick: "Vybor",
  colStake: "Stavka",
  colStatus: "Status",
  viewMatch: "Otkryt match",
  statusOpen: "Otkryta",
  statusClaimable: "K vyplate",
  statusWon: "Vyigrysh",
  statusLost: "Proigrysh",
  statusRefundEligible: "Vozvrat",
  statusRefunded: "Vozvrashcheno",
  sideHome: "Dom",
  sideDraw: "Nichya",
  sideAway: "Gosti",
  updatedAt: (time) => `Obnovleno ${time}`,
};

const ja: WalletCopy = {
  ...en,
  kicker: "ポートフォリオ",
  title: "Wallet",
  lead: "Devnet残高とエスクロー賭け履歴 — 共有プール賭け、オンチェーン決済。",
  totalBalance: "利用可能残高",
  summaryOpen: "オープン",
  summaryStaked: "賭け金合計",
  summaryRealizedPnl: "確定P&L",
  summaryUnrealizedPnl: "未確定P&L",
  activityTitle: "賭け履歴",
  activityLead: "W杯フィクスチャのエスクロープール賭け。",
  activityEmpty: "賭けなし",
  activityEmptyHint: "試合前にエスクロー賭けをして戻ってきてください。",
  activityExpandAll: "すべて表示",
  activityCollapseAll: "折りたたむ",
  connectTitle: "ウォレット接続",
  connectBody: "Solanaウォレットを接続して残高とポジションを表示。",
  connectCta: "ウォレット接続",
  loading: "同期中…",
  syncFailed: "ベット履歴を読み込めませんでした。再試行してください。",
  refresh: "更新",
  colMatch: "試合",
  colPick: "選択",
  colStake: "賭け金",
  colStatus: "状態",
  viewMatch: "試合を見る",
  statusOpen: "オープン",
  statusClaimable: "請求可",
  statusWon: "勝ち",
  statusLost: "負け",
  statusRefundEligible: "返金可",
  statusRefunded: "返金済",
  sideHome: "ホーム",
  sideDraw: "引分",
  sideAway: "アウェイ",
  updatedAt: (time) => `更新 ${time}`,
};

const zh: WalletCopy = {
  ...en,
  kicker: "资产",
  title: "Wallet",
  lead: "Devnet 余额与 escrow 下注历史 — 共享彩池下注、链上结算。",
  totalBalance: "可用余额",
  summaryOpen: "未平仓",
  summaryStaked: "总投注",
  summaryRealizedPnl: "已实现盈亏",
  summaryUnrealizedPnl: "未实现盈亏",
  activityTitle: "下注记录",
  activityLead: "世界杯赛事 escrow 池下注。",
  activityEmpty: "暂无下注",
  activityEmptyHint: "在任意赛事赛前下注 escrow，然后返回此处。",
  activityExpandAll: "显示全部下注",
  activityCollapseAll: "收起",
  connectTitle: "连接钱包",
  connectBody: "连接 Solana 钱包查看 devnet 余额与 escrow 仓位。",
  connectCta: "连接钱包",
  loading: "同步中…",
  syncFailed: "无法加载下注记录，请重试。",
  refresh: "刷新",
  colMatch: "比赛",
  colPick: "选择",
  colStake: "投注",
  colStatus: "状态",
  viewMatch: "查看比赛",
  statusOpen: "进行中",
  statusClaimable: "可领取",
  statusWon: "赢",
  statusLost: "输",
  statusRefundEligible: "可退款",
  statusRefunded: "已退款",
  sideHome: "主",
  sideDraw: "平",
  sideAway: "客",
  updatedAt: (time) => `更新于 ${time}`,
};

const WALLET_COPY: Record<AppLang, WalletCopy> = { en, fr, es, de, pt, ru, ja, zh };

export function walletCopy(lang: AppLang): WalletCopy {
  return WALLET_COPY[lang] ?? WALLET_COPY.en;
}

export function betStatusLabel(lang: AppLang, status: BetLedgerStatus): string {
  const c = walletCopy(lang);
  switch (status) {
    case "open":
      return c.statusOpen;
    case "claimable":
      return c.statusClaimable;
    case "won":
      return c.statusWon;
    case "lost":
      return c.statusLost;
    case "refund_eligible":
      return c.statusRefundEligible;
    case "refunded":
      return c.statusRefunded;
    default:
      return c.statusVoid;
  }
}

export function betPickCountryLabel(
  lang: AppLang,
  side: "home" | "draw" | "away",
  homeTeam: string,
  awayTeam: string,
): string {
  const c = walletCopy(lang);
  if (side === "draw") return c.sideDraw;
  const raw = side === "home" ? homeTeam : awayTeam;
  return teamLabel(raw, lang);
}

export function betSideLabel(
  lang: AppLang,
  side: "home" | "draw" | "away",
): string {
  const c = walletCopy(lang);
  if (side === "home") return c.sideHome;
  if (side === "draw") return c.sideDraw;
  return c.sideAway;
}
