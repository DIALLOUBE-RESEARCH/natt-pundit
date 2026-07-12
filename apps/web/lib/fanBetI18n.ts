import type { FanBetStatus } from "@natt-pundit/natt-core/fan_bet_status";
import type { AppLang } from "@/lib/locales";

export type FanBetCopy = {
  title: string;
  disclaimer: string;
  demoTitle: string;
  demoBody: string;
  faucetSol: string;
  faucetUsdc: string;
  connect: string;
  connected: string;
  connectHint: string;
  sideHome: string;
  sideDraw: string;
  sideAway: string;
  stakeLabel: string;
  placeBet: string;
  placing: string;
  collect: string;
  refund: string;
  collecting: string;
  ticketTitle: string;
  poolTitle: string;
  participants: string;
  poolTotal: string;
  statusLabel: string;
  advancedTitle: string;
  noProgram: string;
  claimReceived: string;
  status: Record<FanBetStatus, string>;
};

const EN: FanBetCopy = {
  title: "Place your bet",
  disclaimer: "World Cup nations — demo on Solana Devnet (test USDC). Not a licensed sportsbook.",
  demoTitle: "Demo mode",
  demoBody: "Use Devnet in your wallet. Get free SOL and USDC from the faucets below.",
  faucetSol: "SOL faucet",
  faucetUsdc: "USDC faucet (Solana Devnet)",
  connect: "Connect wallet",
  connected: "Wallet",
  connectHint: "Connect a Solana Devnet wallet to bet.",
  sideHome: "Home",
  sideDraw: "Draw",
  sideAway: "Away",
  stakeLabel: "Stake (USDC)",
  placeBet: "Place bet",
  placing: "Placing bet…",
  collect: "Collect winnings",
  refund: "Refund stake",
  collecting: "Processing…",
  ticketTitle: "Your ticket",
  poolTitle: "Pool",
  participants: "Bettors",
  poolTotal: "Total pool",
  statusLabel: "Status",
  advancedTitle: "On-chain details",
  noProgram: "Escrow program not configured.",
  claimReceived: "received in wallet",
  status: {
    needs_wallet: "Connect wallet to bet",
    ready_to_bet: "Ready — pick an outcome and stake",
    placing: "Confirm in your wallet…",
    ticket_open: "Ticket open — match not finished",
    live: "Live — ticket locked",
    settling: "Settlement in progress…",
    collect_available: "Winnings ready — collect",
    won_paid: "Paid out",
    lost: "Lost",
    refund_available: "Refund available",
    done: "—",
  },
};

const FR: FanBetCopy = {
  ...EN,
  title: "Placer un pari",
  disclaimer: "Coupe du Monde — demo Solana Devnet (USDC test). Pas un bookmaker agree.",
  demoTitle: "Mode demo",
  demoBody: "Passe ton wallet en Devnet. Recupere SOL et USDC via les faucets.",
  faucetSol: "Faucet SOL",
  faucetUsdc: "Faucet USDC (Solana Devnet)",
  connect: "Connecter wallet",
  connected: "Wallet",
  connectHint: "Connecte un wallet Solana Devnet pour parier.",
  sideHome: "Domicile",
  sideDraw: "Nul",
  sideAway: "Exterieur",
  stakeLabel: "Mise (USDC)",
  placeBet: "Parier",
  placing: "Placement…",
  collect: "Encaisser",
  refund: "Rembourser mise",
  collecting: "Traitement…",
  ticketTitle: "Ton ticket",
  poolTitle: "Pool",
  participants: "Parieurs",
  poolTotal: "Pool total",
  statusLabel: "Statut",
  advancedTitle: "Details on-chain",
  noProgram: "Programme escrow non configure.",
  claimReceived: "recus sur le wallet",
  status: {
    needs_wallet: "Connecte ton wallet",
    ready_to_bet: "Pret — choisis une issue et une mise",
    placing: "Confirme dans ton wallet…",
    ticket_open: "Ticket en cours",
    live: "En direct — ticket verrouille",
    settling: "Reglement en cours…",
    collect_available: "Gains a encaisser",
    won_paid: "Paye",
    lost: "Perdu",
    refund_available: "Remboursement dispo",
    done: "—",
  },
};

const ES: FanBetCopy = {
  ...EN,
  title: "Hacer apuesta",
  placeBet: "Apostar",
  placing: "Colocando…",
  collect: "Cobrar",
  refund: "Reembolso",
  collecting: "Procesando…",
  ticketTitle: "Tu boleto",
  status: {
    ...EN.status,
    ready_to_bet: "Listo — elige resultado y stake",
    collect_available: "Ganancias listas",
    won_paid: "Pagado",
    lost: "Perdido",
    refund_available: "Reembolso disponible",
  },
};

const DE: FanBetCopy = {
  ...EN,
  title: "Wette platzieren",
  placeBet: "Wetten",
  placing: "Wird platziert…",
  collect: "Gewinn abholen",
  refund: "Einsatz zuruck",
  collecting: "Verarbeitung…",
  ticketTitle: "Dein Ticket",
};

const PT: FanBetCopy = {
  ...EN,
  title: "Fazer aposta",
  placeBet: "Apostar",
  placing: "A colocar…",
  collect: "Resgatar",
  refund: "Reembolso",
  collecting: "A processar…",
  ticketTitle: "O teu bilhete",
};

const RU: FanBetCopy = {
  ...EN,
  title: "Сделать ставку",
  placeBet: "Ставка",
  placing: "Размещение…",
  collect: "Получить выигрыш",
  refund: "Возврат",
  collecting: "Обработка…",
  ticketTitle: "Ваш билет",
};

const JA: FanBetCopy = {
  ...EN,
  title: "ベットする",
  placeBet: "ベット",
  placing: "処理中…",
  collect: "受け取る",
  refund: "返金",
  collecting: "処理中…",
  ticketTitle: "チケット",
};

const ZH: FanBetCopy = {
  ...EN,
  title: "下注",
  placeBet: "下注",
  placing: "处理中…",
  collect: "领取奖金",
  refund: "退款",
  collecting: "处理中…",
  ticketTitle: "你的注单",
};

const PACK: Record<AppLang, FanBetCopy> = {
  en: EN,
  fr: FR,
  es: ES,
  de: DE,
  pt: PT,
  ru: RU,
  ja: JA,
  zh: ZH,
};

export function fanBetCopy(lang: AppLang): FanBetCopy {
  return PACK[lang] ?? EN;
}
