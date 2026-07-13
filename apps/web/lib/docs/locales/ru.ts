import type { DocsPack } from "../types";
import {
  DOCS_AGENT_DASHBOARD_URL,
  DOCS_APP_URL,
  DOCS_CDP_PORTAL_URL,
  DOCS_MCP_INFO_URL,
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
          type: "paragraph",
          text: "Продакшен UX кошелька Solana: Reown AppKit + WalletConnect (Phantom, Solflare, mobile deeplink) — см. раздел «Интеграция кошелька».",
        },
        {
          type: "paragraph",
          text: "8 языков + светлая/тёмная тема Stitch во всём приложении — см. раздел «8 языков и светлая/тёмная тема».",
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
      id: "i18n-theme",
      title: "8 языков и светлая/тёмная тема",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement создан для глобального жюри и фанатов — не только английский. Весь путь фаната переведён; Stitch glass UI с продакшен-темой светлый/тёмный.",
        },
        {
          type: "heading3",
          text: "8 языков (полный UI)",
        },
        {
          type: "list",
          items: [
            "Языки: English, Francais, Espanol, 中文, 日本語, Русский, Portugues, Deutsch.",
            "Переключатель в шапке — мгновенно; URL ?lang=ru.",
            "Вкладка Docs — руководство на выбранном языке (все разделы, вкл. Интеграция кошелька).",
            "Список матчей, SETUP/HOLD, ставка, wallet, агент — 8 языков.",
            "Общий locale с HyperNatt (hypernatt_locale).",
          ],
        },
        {
          type: "heading3",
          text: "Светлая / тёмная тема",
        },
        {
          type: "list",
          items: [
            "Переключатель — солнце/луна слева вверху (Stitch glass iOS).",
            "Сохраняется в браузере; все вкладки.",
            "Модал Reown синхронизирует тему.",
            "Тёмная: slate glass, читаемые labels, ночные стадионы.",
            "Светлая: демо для жюри по умолчанию.",
          ],
        },
        {
          type: "alert",
          text: "Совет жюри: ?lang=fr&tab=docs, тёмная тема, подключить Wallet.",
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
            "После матча: **Расчет…** (keeper escrow), затем «Получить выплату» — одна подпись (только claim).",
          ],
        },
        { type: "heading3", text: "Правила" },
        {
          type: "list",
          items: [
            "Только до начала матча. Общий пул (не фиксированные коэффициенты букмекера).",
            "Первая ставка без on-chain пула: до **двух** подтверждений кошелька (создание пула, затем депозит). Далее на тот же матч — одно.",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Получить выигрыш",
      blocks: [
        { type: "paragraph", text: "После FT **keeper escrow** автоматически делает settle пула. Нажми «Получить выплату» — **только claim**, одно подтверждение кошелька." },
        { type: "heading3", text: "Страница матча или Wallet" },
        {
          type: "list",
          items: ["Кнопки получить/возврат в истории Wallet.", "Архивные матчи — только через Wallet."],
        },
        { type: "alert", text: "Матч пропал из списка? Откройте вкладку Wallet." },
      ],
    },
    {
      id: "wallet-integration",
      title: "Интеграция кошелька (Solana)",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement — продакшен UX кошелька, не фейковая кнопка Connect. Фанаты и агенты подписывают реальные транзакции Solana devnet из PWA (десктоп + мобильный).",
        },
        {
          type: "heading3",
          text: "Стек (Solana — не EVM / wagmi)",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — модал WalletConnect (та же семья Reown, что HyperNatt; здесь адаптер Solana).",
            "@reown/appkit-adapter-solana — Phantom, Solflare, WalletConnect на мобильном.",
            "Кастомный deeplink Phantom mobile — connect + sign в Chrome/Safari, возврат в приложение.",
            "Anchor escrow на devnet — SPL USDC deposit, settle, claim, refund.",
          ],
        },
        {
          type: "heading3",
          text: "Подписанные сценарии в приложении",
        },
        {
          type: "list",
          items: [
            "Ставка — escrow deposit (до начала матча).",
            "Получить выплату — **только claim** после auto-settle keeper (после FT).",
            "Возврат ставки — одна сторона или void-пул.",
            "Sign-In With Solana — nonce для экспорта ZIP Data Lab (allowlist).",
            "Вкладка Wallet — балансы, история, claim/refund в каждой строке.",
          ],
        },
        {
          type: "heading3",
          text: "Phantom на мобильном",
        },
        {
          type: "paragraph",
          text: "В мобильном Chrome/Safari: Wallet → открывается Phantom → подтвердите подключение и транзакции → возврат в Natt Settlement, disconnect в аккаунте Reown.",
        },
        {
          type: "alert",
          text: "Escrow только на Solana Devnet. Переключите Phantom/Solflare на Devnet перед ставкой.",
        },
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
    {
      id: "autonomous-agent-cdp",
      title: "Автономный агент (CDP-кошелек)",
      blocks: [
        {
          type: "paragraph",
          text: "Фанаты ставят через Phantom/Reown. Автономный агент использует тот же MCP и подписывает escrow-tx своим Solana-кошельком — без приватных ключей на серверах Natt.",
        },
        { type: "heading3", text: "Как работает" },
        {
          type: "list",
          items: [
            "MCP → инструменты → неподписанные транзакции.",
            "Кошелек агента подписывает — CDP Server Wallet или keypair.",
            "submit_signed_escrow_tx → опрос до done.",
          ],
        },
        { type: "link", label: "Демо-dashboard", href: DOCS_AGENT_DASHBOARD_URL },
        { type: "link", label: "Манифест MCP", href: DOCS_MCP_INFO_URL },
        { type: "heading3", text: "Вариант A — CDP" },
        {
          type: "list",
          items: [
            "Проект Coinbase CDP + CDP_API_KEY_* + CDP_WALLET_SECRET.",
            "Solana devnet; пополнить SOL/USDC.",
          ],
        },
        { type: "link", label: "Портал CDP", href: DOCS_CDP_PORTAL_URL },
        {
          type: "code",
          text: `node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <ID> --outcome home`,
        },
        { type: "heading3", text: "Вариант B — keypair" },
        { type: "list", items: ["natt-agent-autonomous.mjs", "AGENT_WALLET_SECRET"] },
        { type: "alert", text: "docs/AUTONOMOUS_AGENT_CDP.md в публичном репо." },
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
