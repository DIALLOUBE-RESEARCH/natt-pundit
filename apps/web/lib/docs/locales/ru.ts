import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const ruDocs: DocsPack = {
  title: "Документация",
  lead: "Natt Settlement — полное руководство (кошелек, ставки, вывод, MCP-агенты).",
  navAria: "Разделы документации",
  sections: [
    {
      id: "introduction",
      title: "Что такое Natt Settlement?",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement — продукт хакатона TxODDS для ЧМ-2026: live-матчи TxLINE, диагностика SETUP/HOLD, Merkle-доказательства на Solana и escrow-пулы с общим банком на devnet.",
        },
        {
          type: "link",
          label: "GitHub — DIALLOUBE-RESEARCH/natt-pundit",
          href: DOCS_PUBLIC_REPO,
        },
        { type: "paragraph", text: "SETUP — измеримое расхождение с рынком. HOLD — валидное решение." },
      ],
    },
    {
      id: "getting-started",
      title: "С чего начать",
      blocks: [
        {
          type: "list",
          items: [
            `Откройте: ${DOCS_APP_URL}`,
            "Выберите язык (8).",
            "Матчи — список fixtures.",
            "Wallet — подключите кошелек и пополните devnet.",
            "Docs — это руководство на вашем языке.",
            "Connect Agent — Cursor, Claude, MCP.",
          ],
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "Пополнение devnet-кошелька",
      blocks: [
        { type: "alert", text: "Escrow только на Solana Devnet. Нужны SOL (комиссии) и USDC (ставки)." },
        { type: "heading3", text: "1. Переключить на Devnet" },
        { type: "list", items: ["Phantom: настройки → Devnet."] },
        { type: "heading3", text: "2. SOL devnet" },
        { type: "link", label: "Кран Solana", href: DOCS_SOL_FAUCET },
        { type: "heading3", text: "3. USDC devnet" },
        { type: "link", label: "Кран Circle", href: DOCS_USDC_FAUCET },
        {
          type: "list",
          items: ["Мин. ставка 0,01 USDC.", "Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "Как ставить (escrow)",
      blocks: [
        { type: "paragraph", text: "Общий пул — победители делят банк пропорционально." },
        {
          type: "list",
          items: [
            "Кошелек",
            "Выбор стороны + сумма, одна кнопка до начала",
            "После матча: «Получить выплату»",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Получить выигрыш",
      blocks: [
        { type: "paragraph", text: "После FT нажми «Получить выплату» — settle + claim автоматически." },
        { type: "heading3", text: "Страница матча или Wallet" },
        {
          type: "list",
          items: ["Кнопки получить/возврат в истории Wallet.", "Архивные матчи — только через Wallet."],
        },
        { type: "alert", text: "Матч пропал из списка? Откройте вкладку Wallet." },
      ],
    },
    {
      id: "wallet-tab",
      title: "Вкладка Wallet",
      blocks: [
        {
          type: "list",
          items: ["Reown/Phantom", "Балансы SOL/USDC", "История и P&L", "Действия в каждой строке"],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "ИИ-агент (MCP)",
      blocks: [
        { type: "paragraph", text: "20 инструментов MCP. Автономные ставки с devnet-кошельком." },
        { type: "link", label: "MCP endpoint", href: DOCS_MCP_URL },
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
    { id: "fixtures-board", title: "Список матчей", blocks: [{ type: "paragraph", text: "TxLINE fixtures." }] },
    { id: "match-detail", title: "Страница матча", blocks: [{ type: "paragraph", text: "Escrow + Merkle." }] },
    { id: "setup-hold", title: "SETUP vs HOLD", blocks: [{ type: "alert", text: "HOLD — дисциплина." }] },
    { id: "datalab", title: "Data Lab", blocks: [{ type: "paragraph", text: "Экспорт JSONL." }] },
    { id: "clv", title: "CLV", blocks: [{ type: "paragraph", text: "NOT PROVEN YET." }] },
    { id: "merkle-settlement", title: "Merkle", blocks: [{ type: "paragraph", text: "Доказательство TxLINE." }] },
{ id: "activate-txline", title: "Активация TxLINE", blocks: [{ type: "paragraph", text: "/activate" }] },
    { id: "api-reference", title: "API", blocks: [{ type: "list", items: ["GET /mcp-pundit/health"] }] },
    { id: "limitations", title: "Ограничения", blocks: [{ type: "list", items: ["Архив: Wallet для claim."] }] },
    { id: "security", title: "Безопасность", blocks: [{ type: "paragraph", text: "Формула edge скрыта в API." }] },
  ],
};
