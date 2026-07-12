import type { AppLang } from "@/lib/locales";

/**
 * F94N — Agent dashboard copy (8 langs). Ledger/balances labels reuse walletI18n.
 */
export type AgentDashCopy = {
  kicker: string;
  title: string;
  lead: string;
  badge: string;
  identityTitle: string;
  walletLabel: string;
  mcpLabel: string;
  copyWallet: string;
  copiedToast: string;
  explorerCta: string;
  policyTitle: string;
  policyBody: string;
  notConfiguredTitle: string;
  notConfiguredBody: string;
  loadingProfile: string;
};

const en: AgentDashCopy = {
  kicker: "Autonomous Agent",
  title: "Agent Dashboard",
  lead: "Read-only view of the autonomous MCP agent — devnet wallet, escrow bets, on-chain settlement.",
  badge: "MCP Agent",
  identityTitle: "Agent identity",
  walletLabel: "Devnet wallet",
  mcpLabel: "MCP server",
  copyWallet: "Copy address",
  copiedToast: "Address copied",
  explorerCta: "View on Solana Explorer",
  policyTitle: "Betting policy",
  policyBody:
    "This agent bets only when the edge model fires SETUP with medium+ conviction. On HOLD it observes and explains why — every deposit, settle and claim is signed by the agent and verifiable on-chain.",
  notConfiguredTitle: "Agent not configured",
  notConfiguredBody: "No demo agent wallet is set on this deployment.",
  loadingProfile: "Loading agent profile…",
};

const fr: AgentDashCopy = {
  kicker: "Agent autonome",
  title: "Dashboard Agent",
  lead: "Vue read-only de l'agent MCP autonome — wallet devnet, paris escrow, settlement on-chain.",
  badge: "Agent MCP",
  identityTitle: "Identite agent",
  walletLabel: "Wallet devnet",
  mcpLabel: "Serveur MCP",
  copyWallet: "Copier l'adresse",
  copiedToast: "Adresse copiee",
  explorerCta: "Voir sur Solana Explorer",
  policyTitle: "Politique de pari",
  policyBody:
    "Cet agent ne parie que quand le modele edge declenche SETUP avec conviction medium+. Sur HOLD il observe et explique pourquoi — chaque deposit, settle et claim est signe par l'agent et verifiable on-chain.",
  notConfiguredTitle: "Agent non configure",
  notConfiguredBody: "Aucun wallet agent demo n'est defini sur ce deploiement.",
  loadingProfile: "Chargement du profil agent…",
};

const es: AgentDashCopy = {
  ...en,
  kicker: "Agente autonomo",
  title: "Panel del Agente",
  lead: "Vista de solo lectura del agente MCP autonomo — wallet devnet, apuestas escrow, settlement on-chain.",
  badge: "Agente MCP",
  identityTitle: "Identidad del agente",
  walletLabel: "Wallet devnet",
  mcpLabel: "Servidor MCP",
  copyWallet: "Copiar direccion",
  copiedToast: "Direccion copiada",
  explorerCta: "Ver en Solana Explorer",
  policyTitle: "Politica de apuestas",
  policyBody:
    "Este agente solo apuesta cuando el modelo edge dispara SETUP con conviccion medium+. En HOLD observa y explica por que — cada deposit, settle y claim esta firmado por el agente y es verificable on-chain.",
  notConfiguredTitle: "Agente no configurado",
  notConfiguredBody: "No hay wallet de agente demo en este despliegue.",
  loadingProfile: "Cargando perfil del agente…",
};

const de: AgentDashCopy = {
  ...en,
  kicker: "Autonomer Agent",
  title: "Agent-Dashboard",
  lead: "Read-only-Ansicht des autonomen MCP-Agenten — Devnet-Wallet, Escrow-Wetten, On-Chain-Settlement.",
  badge: "MCP-Agent",
  identityTitle: "Agent-Identitaet",
  walletLabel: "Devnet-Wallet",
  mcpLabel: "MCP-Server",
  copyWallet: "Adresse kopieren",
  copiedToast: "Adresse kopiert",
  explorerCta: "Im Solana Explorer ansehen",
  policyTitle: "Wett-Richtlinie",
  policyBody:
    "Dieser Agent wettet nur, wenn das Edge-Modell SETUP mit medium+ Konfidenz meldet. Bei HOLD beobachtet er und erklaert warum — jedes Deposit, Settle und Claim ist vom Agenten signiert und on-chain verifizierbar.",
  notConfiguredTitle: "Agent nicht konfiguriert",
  notConfiguredBody: "Kein Demo-Agent-Wallet auf diesem Deployment gesetzt.",
  loadingProfile: "Agent-Profil wird geladen…",
};

const pt: AgentDashCopy = {
  ...en,
  kicker: "Agente autonomo",
  title: "Painel do Agente",
  lead: "Visao somente leitura do agente MCP autonomo — wallet devnet, apostas escrow, settlement on-chain.",
  badge: "Agente MCP",
  identityTitle: "Identidade do agente",
  walletLabel: "Wallet devnet",
  mcpLabel: "Servidor MCP",
  copyWallet: "Copiar endereco",
  copiedToast: "Endereco copiado",
  explorerCta: "Ver no Solana Explorer",
  policyTitle: "Politica de apostas",
  policyBody:
    "Este agente so aposta quando o modelo edge dispara SETUP com conviccao medium+. Em HOLD ele observa e explica por que — cada deposit, settle e claim e assinado pelo agente e verificavel on-chain.",
  notConfiguredTitle: "Agente nao configurado",
  notConfiguredBody: "Nenhum wallet de agente demo definido neste deploy.",
  loadingProfile: "Carregando perfil do agente…",
};

const ru: AgentDashCopy = {
  ...en,
  kicker: "Автономный агент",
  title: "Панель агента",
  lead: "Read-only обзор автономного MCP-агента — devnet-кошелек, escrow-ставки, on-chain settlement.",
  badge: "MCP-агент",
  identityTitle: "Идентичность агента",
  walletLabel: "Devnet-кошелек",
  mcpLabel: "MCP-сервер",
  copyWallet: "Скопировать адрес",
  copiedToast: "Адрес скопирован",
  explorerCta: "Открыть в Solana Explorer",
  policyTitle: "Политика ставок",
  policyBody:
    "Агент ставит только когда edge-модель дает SETUP с уверенностью medium+. На HOLD он наблюдает и объясняет почему — каждый deposit, settle и claim подписан агентом и проверяем on-chain.",
  notConfiguredTitle: "Агент не настроен",
  notConfiguredBody: "Demo-кошелек агента не задан в этом деплое.",
  loadingProfile: "Загрузка профиля агента…",
};

const ja: AgentDashCopy = {
  ...en,
  kicker: "自律エージェント",
  title: "エージェントダッシュボード",
  lead: "自律MCPエージェントの読み取り専用ビュー — devnetウォレット、エスクローベット、オンチェーン決済。",
  badge: "MCPエージェント",
  identityTitle: "エージェント情報",
  walletLabel: "Devnetウォレット",
  mcpLabel: "MCPサーバー",
  copyWallet: "アドレスをコピー",
  copiedToast: "アドレスをコピーしました",
  explorerCta: "Solana Explorerで見る",
  policyTitle: "ベットポリシー",
  policyBody:
    "このエージェントはedgeモデルがSETUP（medium+の確信度）を出した時のみベットします。HOLDでは観察して理由を説明 — deposit・settle・claimはすべてエージェントが署名し、オンチェーンで検証可能。",
  notConfiguredTitle: "エージェント未設定",
  notConfiguredBody: "このデプロイにはデモエージェントのウォレットが設定されていません。",
  loadingProfile: "エージェントプロフィールを読み込み中…",
};

const zh: AgentDashCopy = {
  ...en,
  kicker: "自主代理",
  title: "代理仪表盘",
  lead: "自主 MCP 代理的只读视图 — devnet 钱包、托管投注、链上结算。",
  badge: "MCP 代理",
  identityTitle: "代理身份",
  walletLabel: "Devnet 钱包",
  mcpLabel: "MCP 服务器",
  copyWallet: "复制地址",
  copiedToast: "地址已复制",
  explorerCta: "在 Solana Explorer 查看",
  policyTitle: "投注策略",
  policyBody:
    "该代理仅在 edge 模型给出 SETUP（medium+ 置信度）时才投注。HOLD 时它只观察并解释原因 — 每笔 deposit、settle 和 claim 均由代理签名，可在链上验证。",
  notConfiguredTitle: "代理未配置",
  notConfiguredBody: "此部署未设置演示代理钱包。",
  loadingProfile: "正在加载代理资料…",
};

const COPY: Record<AppLang, AgentDashCopy> = { en, fr, es, de, pt, ru, ja, zh };

export function agentDashCopy(lang: AppLang): AgentDashCopy {
  return COPY[lang] ?? COPY.en;
}
