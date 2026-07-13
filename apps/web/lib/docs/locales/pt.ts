import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const ptDocs: DocsPack = {
  title: "Documentacao",
  lead: "Natt Settlement — guia completo (wallet, apostas, saques, agentes MCP).",
  navAria: "Secoes da documentacao",
  sections: [
    {
      id: "introduction",
      title: "O que e Natt Settlement?",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement e um produto hackathon TxODDS para a Copa 2026: fixtures TxLINE ao vivo, diagnostico SETUP/HOLD, provas Merkle na Solana e pools escrow de pote partilhado em devnet.",
        },
        {
          type: "paragraph",
          text: "UX wallet Solana de producao: Reown AppKit + WalletConnect (Phantom, Solflare, deeplink mobile) — veja Integracao wallet.",
        },
        {
          type: "link",
          label: "GitHub — DIALLOUBE-RESEARCH/natt-pundit",
          href: DOCS_PUBLIC_REPO,
        },
        { type: "paragraph", text: "SETUP sinaliza divergencia mensuravel. HOLD e decisao valida." },
      ],
    },
    {
      id: "getting-started",
      title: "Primeiros passos",
      blocks: [
        {
          type: "list",
          items: [
            `Abra: ${DOCS_APP_URL}`,
            "Escolha o idioma (8).",
            "Jogos — fixtures.",
            "Wallet — conectar e fundar devnet.",
            "Docs — este guia.",
            "Connect Agent — Cursor, Claude, MCP.",
          ],
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "Fundar wallet devnet",
      blocks: [
        { type: "alert", text: "Escrow usa apenas Solana Devnet. Precisa SOL (taxas) e USDC (apostas)." },
        { type: "heading3", text: "1. Devnet no wallet" },
        { type: "list", items: ["Phantom: Devnet nas configuracoes."] },
        { type: "heading3", text: "2. SOL devnet" },
        { type: "link", label: "Faucet Solana", href: DOCS_SOL_FAUCET },
        { type: "heading3", text: "3. USDC devnet" },
        { type: "link", label: "Faucet Circle", href: DOCS_USDC_FAUCET },
        {
          type: "list",
          items: ["Minimo 0,01 USDC.", "Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "Como apostar",
      blocks: [
        { type: "paragraph", text: "Pool de pote partilhado — ganhadores dividem o pote." },
        {
          type: "list",
          items: [
            "Wallet",
            "Escolher lado + valor, um toque antes do apito",
            "Apos o jogo: «Receber»",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Recuperar ganhos",
      blocks: [
        { type: "paragraph", text: "Apos FT toca «Receber» — settle + claim automaticos." },
        { type: "heading3", text: "Pagina do jogo ou Wallet" },
        {
          type: "list",
          items: ["Botoes Receber/Reembolso na lista Wallet.", "Jogos arquivados: use Wallet."],
        },
        { type: "alert", text: "Jogo sumiu da lista? Wallet tab." },
      ],
    },
    {
      id: "wallet-integration",
      title: "Integracao wallet (Solana)",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement traz UX wallet de producao — nao um botao connect falso. Fas e agentes assinam transacoes reais na Solana devnet pela PWA (desktop + mobile).",
        },
        {
          type: "heading3",
          text: "Stack (Solana — nao EVM / wagmi)",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — modal WalletConnect (mesma familia Reown do HyperNatt; adaptador Solana aqui).",
            "@reown/appkit-adapter-solana — Phantom, Solflare, WalletConnect mobile.",
            "Deeplink Phantom mobile custom — conectar e assinar no Chrome/Safari, voltar ao app.",
            "Escrow Anchor em devnet — deposito SPL USDC, settle, claim, refund.",
          ],
        },
        {
          type: "heading3",
          text: "Fluxos assinados no app",
        },
        {
          type: "list",
          items: [
            "Apostar — deposito escrow (pre-jogo).",
            "Receber — settle do pool + claim apos FT.",
            "Reembolso — lado solo ou pool void.",
            "Sign-In With Solana — nonce para export ZIP Data Lab (allowlist).",
            "Aba Wallet — saldos, historico, claim/refund por linha.",
          ],
        },
        {
          type: "heading3",
          text: "Phantom mobile",
        },
        {
          type: "paragraph",
          text: "No Chrome/Safari mobile: toque Wallet → Phantom abre → aprove conexao e transacoes → volta ao Natt Settlement com disconnect na vista conta Reown.",
        },
        {
          type: "alert",
          text: "Escrow usa apenas Solana Devnet. Mude Phantom/Solflare para Devnet antes de apostar.",
        },
      ],
    },
    {
      id: "wallet-tab",
      title: "Aba Wallet",
      blocks: [
        {
          type: "list",
          items: ["Reown/Phantom", "Saldos SOL/USDC", "Historico e P&L", "Acoes por linha"],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "Agente IA (MCP)",
      blocks: [
        { type: "paragraph", text: "20 ferramentas MCP. Agentes autonomos com wallet devnet." },
        { type: "link", label: "MCP", href: DOCS_MCP_URL },
        { type: "heading3", text: "Cursor" },
        { type: "list", items: ["Connect Agent → Cursor", "get_pundit_manifest"] },
        {
          type: "code",
          text: `{\n  "mcpServers": {\n    "natt-pundit": {\n      "url": "${DOCS_MCP_URL}"\n    }\n  }\n}`,
        },
        { type: "heading3", text: "Claude Code" },
        {
          type: "code",
          text: `claude mcp add --scope user --transport http natt-pundit ${DOCS_MCP_URL}`,
        },
      ],
    },
    { id: "fixtures-board", title: "Jogos", blocks: [{ type: "paragraph", text: "Board TxLINE." }] },
    { id: "match-detail", title: "Pagina do jogo", blocks: [{ type: "paragraph", text: "Escrow + Merkle." }] },
    { id: "setup-hold", title: "SETUP vs HOLD", blocks: [{ type: "alert", text: "HOLD e disciplina." }] },
    { id: "datalab", title: "Data Lab", blocks: [{ type: "paragraph", text: "Export JSONL." }] },
    { id: "clv", title: "CLV", blocks: [{ type: "paragraph", text: "NOT PROVEN YET." }] },
    { id: "merkle-settlement", title: "Merkle", blocks: [{ type: "paragraph", text: "Prova TxLINE." }] },
{ id: "activate-txline", title: "Ativar TxLINE", blocks: [{ type: "paragraph", text: "/activate" }] },
    { id: "api-reference", title: "API", blocks: [{ type: "list", items: ["GET /mcp-pundit/health"] }] },
    { id: "limitations", title: "Limitacoes", blocks: [{ type: "list", items: ["Use Wallet para claims."] }] },
    { id: "security", title: "Seguranca", blocks: [{ type: "paragraph", text: "Formula edge redacted." }] },
  ],
};
