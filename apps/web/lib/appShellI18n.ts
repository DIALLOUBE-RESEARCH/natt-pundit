import type { AppLang } from "@/lib/locales";

export type AppShellCopy = {
  ariaHome: string;
  ariaMainNav: string;
  ariaLanguage: string;
  walletLabel: string;
  walletConnectPill: string;
  walletDisabledTitle: string;
  walletProjectIdHint: string;
  poweredByLabel: string;
  presentToggleTitle: string;
  offlineTitle: string;
  offlineBody: string;
  offlineBack: string;
  activateTitle: string;
  activateLead: string;
  activateStepATitle: string;
  activateStepABody: string;
  activateStepBTitle: string;
  activateStepBBody: string;
  subscribeOnChain: string;
  signing: string;
  activateApiToken: string;
  txSigLabel: string;
  txSigPlaceholder: string;
  pasteTokenHint: string;
  officialWcDocs: string;
  connectWalletFirst: string;
  runSubscribeFirst: string;
  openWalletPicker: string;
  walletStackHint: string;
  connectSolanaWallet: string;
  connecting: string;
  proofSourcePrefix: string;
  proofHistoryTitle: string;
  proofVerifiedBadge: string;
  proofPendingBadge: string;
  timelineTitle: string;
  timelineBody: string;
  timelineExpand: string;
  timelineCollapse: string;
  timelineEventsLabel: string;
  favoriteAdd: string;
  favoriteRemove: string;
  worldCupFallback: string;
  escrowDevnetSol: string;
  escrowDevnetUsdc: string;
  edgeDirection: string;
};

const en: AppShellCopy = {
  ariaHome: "Natt Settlement home",
  ariaMainNav: "Main navigation",
  ariaLanguage: "Language",
  walletLabel: "Wallet",
  walletConnectPill: "Wallet",
  walletDisabledTitle: "Set NEXT_PUBLIC_PROJECT_ID",
  walletProjectIdHint: "Set NEXT_PUBLIC_PROJECT_ID for Reown modal (prod).",
  poweredByLabel: "Powered by",
  presentToggleTitle: "Demo subtitles",
  offlineTitle: "Offline",
  offlineBody: "No fake scores. Reconnect to follow the live match.",
  offlineBack: "Back",
  activateTitle: "Activate TxLINE",
  activateLead:
    "Connect your Solana wallet (MetaMask Solana or Phantom), subscribe to the free WC tier, retrieve your API token.",
  activateStepATitle: "Step A — Free WC tier subscribe",
  activateStepABody:
    "Sign the on-chain transaction. TxLINE is free — budget ~0.01 SOL for network fees.",
  activateStepBTitle: "Step B — Activate API",
  activateStepBBody: "Sign the activation message with the same wallet.",
  subscribeOnChain: "Subscribe on-chain",
  signing: "Signing…",
  activateApiToken: "Activate API token",
  txSigLabel: "txSig — auto-filled after step A",
  txSigPlaceholder: "5x…",
  pasteTokenHint: "Paste into TXLINE_API_TOKEN on VPS then rebuild gateway.",
  officialWcDocs: "Official World Cup Free Tier docs",
  connectWalletFirst: "Connect your wallet first.",
  runSubscribeFirst: "Run subscribe (step A) first or paste a txSig.",
  openWalletPicker: "Open wallet picker",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — same Reown stack as HyperNatt.",
  connectSolanaWallet: "Connect Solana wallet",
  connecting: "Connecting…",
  proofSourcePrefix: "Source:",
  proofHistoryTitle: "Proof history (this session)",
  proofVerifiedBadge: "verified",
  proofPendingBadge: "pending",
  timelineTitle: "Live timeline",
  timelineBody: "Goals and cards as the match unfolds.",
  timelineExpand: "Show all",
  timelineCollapse: "Hide",
  timelineEventsLabel: "{n} events",
  favoriteAdd: "Add to favorites",
  favoriteRemove: "Remove from favorites",
  worldCupFallback: "World Cup",
  escrowDevnetSol: "Devnet SOL required (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "Devnet USDC required. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Direction",
};

const fr: AppShellCopy = {
  ...en,
  ariaHome: "Accueil Natt Settlement",
  ariaMainNav: "Navigation principale",
  ariaLanguage: "Langue",
  walletLabel: "Wallet",
  walletConnectPill: "Wallet",
  walletDisabledTitle: "Definir NEXT_PUBLIC_PROJECT_ID",
  walletProjectIdHint: "Definir NEXT_PUBLIC_PROJECT_ID pour la modale Reown (prod).",
  poweredByLabel: "Propulse par",
  presentToggleTitle: "Sous-titres demo video",
  offlineTitle: "Hors ligne",
  offlineBody: "Pas de faux scores. Reconnecte-toi pour suivre le match live.",
  offlineBack: "Retour",
  activateTitle: "Activer TxLINE",
  activateLead:
    "Connecte ton wallet Solana (MetaMask Solana ou Phantom), abonne-toi au tier WC gratuit, recupere ton token API.",
  activateStepATitle: "Etape A — Abonnement tier WC gratuit",
  activateStepABody:
    "Signe la transaction on-chain. TxLINE est gratuit — prevois ~0.01 SOL pour les frais reseau.",
  activateStepBTitle: "Etape B — Activer l API",
  activateStepBBody: "Signe le message d activation avec le meme wallet.",
  subscribeOnChain: "S abonner on-chain",
  signing: "Signature…",
  activateApiToken: "Activer le token API",
  txSigLabel: "txSig — rempli auto apres etape A",
  txSigPlaceholder: "5x…",
  pasteTokenHint: "Coller dans TXLINE_API_TOKEN sur le VPS puis rebuild gateway.",
  officialWcDocs: "Docs officielles World Cup Free Tier",
  connectWalletFirst: "Connecte ton wallet d abord.",
  runSubscribeFirst: "Lance l abonnement (etape A) ou colle un txSig.",
  openWalletPicker: "Ouvrir le selecteur wallet",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — meme stack Reown qu HyperNatt.",
  connectSolanaWallet: "Connecter wallet Solana",
  connecting: "Connexion…",
  proofSourcePrefix: "Source :",
  proofHistoryTitle: "Historique preuves (cette session)",
  proofVerifiedBadge: "verifie",
  proofPendingBadge: "en attente",
  timelineTitle: "Timeline live",
  timelineBody: "Buts et cartons au fil du match.",
  timelineExpand: "Tout afficher",
  timelineCollapse: "Reduire",
  timelineEventsLabel: "{n} evenements",
  favoriteAdd: "Ajouter aux favoris",
  favoriteRemove: "Retirer des favoris",
  worldCupFallback: "Coupe du Monde",
  escrowDevnetSol: "SOL devnet requis (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "USDC devnet requis. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Direction",
};

const es: AppShellCopy = {
  ...en,
  ariaHome: "Inicio Natt Settlement",
  ariaMainNav: "Navegacion principal",
  ariaLanguage: "Idioma",
  walletLabel: "Wallet",
  poweredByLabel: "Impulsado por",
  presentToggleTitle: "Subtitulos demo video",
  offlineTitle: "Sin conexion",
  offlineBody: "Sin marcadores falsos. Reconectate para seguir el partido en vivo.",
  offlineBack: "Volver",
  activateTitle: "Activar TxLINE",
  activateLead:
    "Conecta tu wallet Solana, suscribete al tier WC gratuito y recupera tu token API.",
  activateStepATitle: "Paso A — Suscripcion tier WC gratuito",
  activateStepABody:
    "Firma la transaccion on-chain. TxLINE es gratis — reserva ~0.01 SOL para comisiones.",
  activateStepBTitle: "Paso B — Activar API",
  activateStepBBody: "Firma el mensaje de activacion con la misma wallet.",
  subscribeOnChain: "Suscribirse on-chain",
  signing: "Firmando…",
  activateApiToken: "Activar token API",
  txSigLabel: "txSig — auto tras paso A",
  pasteTokenHint: "Pegar en TXLINE_API_TOKEN en VPS y rebuild gateway.",
  officialWcDocs: "Docs oficiales World Cup Free Tier",
  connectWalletFirst: "Conecta tu wallet primero.",
  runSubscribeFirst: "Ejecuta suscripcion (paso A) o pega un txSig.",
  openWalletPicker: "Abrir selector wallet",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — mismo stack Reown que HyperNatt.",
  connectSolanaWallet: "Conectar wallet Solana",
  connecting: "Conectando…",
  proofSourcePrefix: "Fuente:",
  proofHistoryTitle: "Historial de pruebas (esta sesion)",
  proofVerifiedBadge: "verificado",
  proofPendingBadge: "pendiente",
  timelineTitle: "Cronologia en vivo",
  timelineBody: "Goles y tarjetas durante el partido.",
  timelineExpand: "Ver todo",
  timelineCollapse: "Ocultar",
  timelineEventsLabel: "{n} eventos",
  favoriteAdd: "Anadir a favoritos",
  favoriteRemove: "Quitar de favoritos",
  worldCupFallback: "Copa Mundial",
  escrowDevnetSol: "SOL devnet requerido (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "USDC devnet requerido. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Direccion",
};

const de: AppShellCopy = {
  ...en,
  ariaHome: "Natt Settlement Startseite",
  ariaMainNav: "Hauptnavigation",
  ariaLanguage: "Sprache",
  walletLabel: "Wallet",
  poweredByLabel: "Powered by",
  presentToggleTitle: "Demo-Untertitel",
  offlineTitle: "Offline",
  offlineBody: "Keine falschen Ergebnisse. Verbinde dich neu fur Live-Spiel.",
  offlineBack: "Zuruck",
  activateTitle: "TxLINE aktivieren",
  activateLead:
    "Solana-Wallet verbinden, kostenlosen WC-Tier abonnieren, API-Token abrufen.",
  activateStepATitle: "Schritt A — Kostenloser WC-Tier",
  activateStepABody:
    "On-Chain-Transaktion signieren. TxLINE ist kostenlos — ~0.01 SOL fur Netzwerkgebuhren einplanen.",
  activateStepBTitle: "Schritt B — API aktivieren",
  activateStepBBody: "Aktivierungsnachricht mit derselben Wallet signieren.",
  subscribeOnChain: "On-Chain abonnieren",
  signing: "Signiere…",
  activateApiToken: "API-Token aktivieren",
  txSigLabel: "txSig — auto nach Schritt A",
  pasteTokenHint: "In TXLINE_API_TOKEN auf VPS einfugen, dann Gateway rebuild.",
  officialWcDocs: "Offizielle World Cup Free Tier Docs",
  connectWalletFirst: "Zuerst Wallet verbinden.",
  runSubscribeFirst: "Abonnement (Schritt A) ausfuhren oder txSig einfugen.",
  openWalletPicker: "Wallet-Auswahl offnen",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — gleicher Reown-Stack wie HyperNatt.",
  connectSolanaWallet: "Solana-Wallet verbinden",
  connecting: "Verbinde…",
  proofSourcePrefix: "Quelle:",
  proofHistoryTitle: "Proof-Verlauf (diese Sitzung)",
  proofVerifiedBadge: "verifiziert",
  proofPendingBadge: "ausstehend",
  timelineTitle: "Live-Verlauf",
  timelineBody: "Tore und Karten im Spielverlauf.",
  timelineExpand: "Alles anzeigen",
  timelineCollapse: "Einklappen",
  timelineEventsLabel: "{n} Ereignisse",
  favoriteAdd: "Zu Favoriten",
  favoriteRemove: "Aus Favoriten entfernen",
  worldCupFallback: "WM",
  escrowDevnetSol: "Devnet SOL erforderlich (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "Devnet USDC erforderlich. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Richtung",
};

const pt: AppShellCopy = {
  ...en,
  ariaHome: "Inicio Natt Settlement",
  ariaMainNav: "Navegacao principal",
  ariaLanguage: "Idioma",
  walletLabel: "Wallet",
  poweredByLabel: "Powered by",
  presentToggleTitle: "Legendas demo video",
  offlineTitle: "Offline",
  offlineBody: "Sem placares falsos. Reconecta para acompanhar o jogo ao vivo.",
  offlineBack: "Voltar",
  activateTitle: "Ativar TxLINE",
  activateLead:
    "Conecta a wallet Solana, subscreve o tier WC gratuito e obtem o token API.",
  activateStepATitle: "Passo A — Subscricao tier WC gratuito",
  activateStepABody:
    "Assina a transacao on-chain. TxLINE e gratis — reserva ~0.01 SOL para taxas.",
  activateStepBTitle: "Passo B — Ativar API",
  activateStepBBody: "Assina a mensagem de ativacao com a mesma wallet.",
  subscribeOnChain: "Subscrever on-chain",
  signing: "A assinar…",
  activateApiToken: "Ativar token API",
  txSigLabel: "txSig — auto apos passo A",
  pasteTokenHint: "Colar em TXLINE_API_TOKEN no VPS e rebuild gateway.",
  officialWcDocs: "Docs oficiais World Cup Free Tier",
  connectWalletFirst: "Conecta a wallet primeiro.",
  runSubscribeFirst: "Executa subscricao (passo A) ou cola um txSig.",
  openWalletPicker: "Abrir seletor wallet",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — mesmo stack Reown que HyperNatt.",
  connectSolanaWallet: "Conectar wallet Solana",
  connecting: "A conectar…",
  proofSourcePrefix: "Fonte:",
  proofHistoryTitle: "Historico de provas (esta sessao)",
  proofVerifiedBadge: "verificado",
  proofPendingBadge: "pendente",
  timelineTitle: "Linha do tempo ao vivo",
  timelineBody: "Gols e cartoes durante a partida.",
  timelineExpand: "Mostrar tudo",
  timelineCollapse: "Ocultar",
  timelineEventsLabel: "{n} eventos",
  favoriteAdd: "Adicionar aos favoritos",
  favoriteRemove: "Remover dos favoritos",
  worldCupFallback: "Copa do Mundo",
  escrowDevnetSol: "SOL devnet necessario (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "USDC devnet necessario. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Direcao",
};

const ru: AppShellCopy = {
  ...en,
  ariaHome: "Glavnaya Natt Settlement",
  ariaMainNav: "Osnovnaya navigatsiya",
  ariaLanguage: "Yazyk",
  walletLabel: "Koshelek",
  walletConnectPill: "Wallet",
  poweredByLabel: "Powered by",
  presentToggleTitle: "Subtitry demo",
  offlineTitle: "Offline",
  offlineBody: "Bez falshivykh schetov. Podklyuchis snova dlya live matcha.",
  offlineBack: "Nazad",
  activateTitle: "Aktivirovat TxLINE",
  activateLead:
    "Podklyuchi Solana koshelek, podpishis na besplatnyy WC tier, poluchi API token.",
  activateStepATitle: "Shag A — Besplatnyy WC tier",
  activateStepABody:
    "Podpishi on-chain tranzaktsiyu. TxLINE besplatno — zalozhi ~0.01 SOL na komissii.",
  activateStepBTitle: "Shag B — Aktivirovat API",
  activateStepBBody: "Podpishi soobshchenie aktivatsii tem zhe koshelkom.",
  subscribeOnChain: "Podpiska on-chain",
  signing: "Podpis…",
  activateApiToken: "Aktivirovat API token",
  txSigLabel: "txSig — avto posle shaga A",
  pasteTokenHint: "Vstav v TXLINE_API_TOKEN na VPS i rebuild gateway.",
  officialWcDocs: "Ofitsialnye World Cup Free Tier docs",
  connectWalletFirst: "Snachala podklyuchi koshelek.",
  runSubscribeFirst: "Zapusti podpisku (shag A) ili vstav txSig.",
  openWalletPicker: "Otkryt vybor koshelka",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — tot zhe Reown stack chto HyperNatt.",
  connectSolanaWallet: "Podklyuchit Solana koshelek",
  connecting: "Podklyuchenie…",
  proofSourcePrefix: "Istochnik:",
  proofHistoryTitle: "Istoriya dokazatelstv (sessiya)",
  proofVerifiedBadge: "provereno",
  proofPendingBadge: "ozhidaet",
  timelineTitle: "Khronika matcha",
  timelineBody: "Goly i kartochki po khodu matcha.",
  timelineExpand: "Pokazat vse",
  timelineCollapse: "Svernut",
  timelineEventsLabel: "{n} sobytiy",
  favoriteAdd: "V izbrannoe",
  favoriteRemove: "Ubrat iz izbrannogo",
  worldCupFallback: "Chempionat mira",
  escrowDevnetSol: "Nuzhen devnet SOL (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "Nuzhen devnet USDC. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Napravlenie",
};

const ja: AppShellCopy = {
  ...en,
  ariaHome: "Natt Settlement home",
  ariaMainNav: "Main navigation",
  ariaLanguage: "Language",
  walletLabel: "Wallet",
  poweredByLabel: "Powered by",
  presentToggleTitle: "Demo subtitles",
  offlineTitle: "Offline",
  offlineBody: "No fake scores. Reconnect to follow the live match.",
  offlineBack: "Back",
  activateTitle: "Activate TxLINE",
  activateLead:
    "Connect Solana wallet, subscribe to free WC tier, retrieve API token.",
  activateStepATitle: "Step A — Free WC tier subscribe",
  activateStepABody: "Sign on-chain transaction. TxLINE is free — budget ~0.01 SOL for fees.",
  activateStepBTitle: "Step B — Activate API",
  activateStepBBody: "Sign activation message with same wallet.",
  subscribeOnChain: "Subscribe on-chain",
  signing: "Signing…",
  activateApiToken: "Activate API token",
  txSigLabel: "txSig — auto after step A",
  pasteTokenHint: "Paste into TXLINE_API_TOKEN on VPS then rebuild gateway.",
  officialWcDocs: "Official World Cup Free Tier docs",
  connectWalletFirst: "Connect wallet first.",
  runSubscribeFirst: "Run subscribe (step A) first or paste txSig.",
  openWalletPicker: "Open wallet picker",
  walletStackHint: "Phantom, Solflare, WalletConnect mobile — same Reown stack as HyperNatt.",
  connectSolanaWallet: "Connect Solana wallet",
  connecting: "Connecting…",
  proofSourcePrefix: "Source:",
  proofHistoryTitle: "Proof history (this session)",
  proofVerifiedBadge: "verified",
  proofPendingBadge: "pending",
  timelineTitle: "Live timeline",
  timelineBody: "Goals and cards as the match unfolds.",
  timelineExpand: "すべて表示",
  timelineCollapse: "閉じる",
  timelineEventsLabel: "{n} 件",
  favoriteAdd: "Add to favorites",
  favoriteRemove: "Remove from favorites",
  worldCupFallback: "World Cup",
  escrowDevnetSol: "Devnet SOL required (~0.01 min). Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "Devnet USDC required. faucet.circle.com (Solana Devnet)",
  edgeDirection: "Direction",
};

const zh: AppShellCopy = {
  ...en,
  ariaHome: "Natt Settlement 首页",
  ariaMainNav: "主导航",
  ariaLanguage: "语言",
  walletLabel: "钱包",
  walletConnectPill: "钱包",
  poweredByLabel: "技术支持",
  presentToggleTitle: "演示字幕",
  offlineTitle: "离线",
  offlineBody: "无虚假比分。重新连接以跟踪实时比赛。",
  offlineBack: "返回",
  activateTitle: "激活 TxLINE",
  activateLead: "连接 Solana 钱包，订阅免费 WC 层级，获取 API 令牌。",
  activateStepATitle: "步骤 A — 免费 WC 层级订阅",
  activateStepABody: "签署链上交易。TxLINE 免费 — 预留约 0.01 SOL 网络费。",
  activateStepBTitle: "步骤 B — 激活 API",
  activateStepBBody: "使用同一钱包签署激活消息。",
  subscribeOnChain: "链上订阅",
  signing: "签名中…",
  activateApiToken: "激活 API 令牌",
  txSigLabel: "txSig — 步骤 A 后自动填充",
  pasteTokenHint: "粘贴到 VPS 的 TXLINE_API_TOKEN 然后 rebuild gateway。",
  officialWcDocs: "官方世界杯免费层级文档",
  connectWalletFirst: "请先连接钱包。",
  runSubscribeFirst: "先运行订阅（步骤 A）或粘贴 txSig。",
  openWalletPicker: "打开钱包选择器",
  walletStackHint: "Phantom、Solflare、WalletConnect 移动版 — 与 HyperNatt 相同的 Reown 栈。",
  connectSolanaWallet: "连接 Solana 钱包",
  connecting: "连接中…",
  proofSourcePrefix: "来源：",
  proofHistoryTitle: "证明历史（本次会话）",
  proofVerifiedBadge: "已验证",
  proofPendingBadge: "待处理",
  timelineTitle: "实时时间线",
  timelineBody: "比赛进行中的进球与黄牌。",
  timelineExpand: "展开全部",
  timelineCollapse: "收起",
  timelineEventsLabel: "{n} 个事件",
  favoriteAdd: "添加到收藏",
  favoriteRemove: "从收藏移除",
  worldCupFallback: "世界杯",
  escrowDevnetSol: "需要 devnet SOL（约 0.01 最低）。Phantom → Devnet → faucet.solana.com",
  escrowDevnetUsdc: "需要 devnet USDC。faucet.circle.com（Solana Devnet）",
  edgeDirection: "方向",
};

export const APP_SHELL: Record<AppLang, AppShellCopy> = { en, fr, es, de, pt, ru, ja, zh };

export function shell(lang: AppLang): AppShellCopy {
  return APP_SHELL[lang] ?? APP_SHELL.en;
}

export function formatTimelineEvents(lang: AppLang, count: number): string {
  return (APP_SHELL[lang] ?? APP_SHELL.en).timelineEventsLabel.replace("{n}", String(count));
}
