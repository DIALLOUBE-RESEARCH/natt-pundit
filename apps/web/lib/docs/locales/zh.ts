import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const zhDocs: DocsPack = {
  title: "文档",
  lead: "Natt Settlement — 完整用户指南（钱包、下注、领取、MCP 代理）。",
  navAria: "文档章节",
  sections: [
    {
      id: "introduction",
      title: "什么是 Natt Settlement？",
      blocks: [
        {
          type: "paragraph",
          text: "TxODDS 黑客松产品，面向 2026 世界杯：TxLINE 赛程、SETUP/HOLD 边缘诊断、Solana Merkle 证明、devnet 共享彩池托管。",
        },
        {
          type: "paragraph",
          text: "生产级 Solana 钱包：Reown AppKit + WalletConnect（Phantom、Solflare、移动深链接）— 见「钱包集成」章节。",
        },
        {
          type: "paragraph",
          text: "全应用 8 种语言 + Stitch 浅/深主题 — 见「8 种语言与浅色/深色模式」章节。",
        },
        {
          type: "link",
          label: "GitHub — DIALLOUBE-RESEARCH/natt-pundit",
          href: DOCS_PUBLIC_REPO,
        },
        { type: "paragraph", text: "SETUP 表示模型与市场共识的可测分歧。HOLD 是有效决策。" },
      ],
    },
    {
      id: "getting-started",
      title: "快速开始",
      blocks: [
        {
          type: "list",
          items: [
            `打开应用：${DOCS_APP_URL}`,
            "页头选择语言（8 种）。",
            "比赛 — 浏览赛程。",
            "钱包 — 连接 Solana、充值 devnet。",
            "文档 — 本指南（当前语言）。",
            "Connect Agent — Cursor / Claude / MCP。",
          ],
        },
      ],
    },
    {
      id: "i18n-theme",
      title: "8 种语言与浅色/深色模式",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement 面向全球评审与球迷 — 非仅英语。完整球迷路径已翻译；Stitch 玻璃 UI 含生产级浅色/深色主题。",
        },
        {
          type: "heading3",
          text: "8 种语言（完整 UI）",
        },
        {
          type: "list",
          items: [
            "语言：English、Français、Español、中文、日本語、Русский、Português、Deutsch。",
            "页头语言选择 — 即时切换；URL ?lang=zh。",
            "文档标签 — 本指南随所选语言（含钱包集成等全部章节）。",
            "赛程、SETUP/HOLD、下注、钱包、代理 — 8 种语言。",
            "与 HyperNatt 共享 locale（hypernatt_locale）。",
          ],
        },
        {
          type: "heading3",
          text: "浅色 / 深色",
        },
        {
          type: "list",
          items: [
            "主题切换 — 左上角太阳/月亮（iOS 风 Stitch 玻璃）。",
            "浏览器持久化；所有标签页生效。",
            "Reown 钱包弹窗同步同一主题。",
            "深色：slate 玻璃、比赛详情可读标签、夜间球场图。",
            "浅色：评审默认演示。",
          ],
        },
        {
          type: "alert",
          text: "评审提示：?lang=fr&tab=docs，切深色，连接 Wallet。",
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "充值 devnet 钱包",
      blocks: [
        { type: "alert", text: "托管投注仅使用 Solana Devnet。需要 devnet SOL（手续费）和 USDC（本金）。" },
        { type: "heading3", text: "1. 切换到 Devnet" },
        { type: "list", items: ["Phantom：设置 → Devnet。"] },
        { type: "heading3", text: "2. devnet SOL" },
        { type: "link", label: "Solana 水龙头", href: DOCS_SOL_FAUCET },
        { type: "heading3", text: "3. devnet USDC" },
        { type: "link", label: "Circle 水龙头", href: DOCS_USDC_FAUCET },
        {
          type: "list",
          items: ["最低投注 0.01 USDC。", "Mint：4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "如何下注（托管）",
      blocks: [
        { type: "paragraph", text: "共享彩池下注 — 赢家按比例分配奖池。" },
        {
          type: "list",
          items: ["连接钱包", "开赛前选边 + 金额，一键下注", "赛后点击「领取」"],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "领取奖金",
      blocks: [
        { type: "paragraph", text: "全场结束后点击「领取」— 应用自动结算并发放奖金。" },
        { type: "heading3", text: "比赛页或钱包" },
        {
          type: "list",
          items: ["钱包历史每行有「领取」/退款按钮。", "已下架比赛请用钱包操作。"],
        },
        { type: "alert", text: "比赛从列表消失？请打开钱包标签。" },
      ],
    },
    {
      id: "wallet-integration",
      title: "钱包集成（Solana）",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement 提供生产级钱包体验 — 不是假的连接按钮。用户与代理在 PWA（桌面 + 移动）中签署真实的 Solana devnet 交易。",
        },
        {
          type: "heading3",
          text: "技术栈（Solana — 非 EVM / wagmi）",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — WalletConnect 弹窗（与 HyperNatt 同系 Reown；此处为 Solana 适配器）。",
            "@reown/appkit-adapter-solana — Phantom、Solflare、移动端 WalletConnect。",
            "自定义 Phantom 移动深链接 — 在 Chrome/Safari 连接并签名，返回应用。",
            "devnet Anchor 托管 — SPL USDC 存入、结算、领取、退款。",
          ],
        },
        {
          type: "heading3",
          text: "应用内签名流程",
        },
        {
          type: "list",
          items: [
            "下注 — 托管存入（开赛前）。",
            "领取奖金 — 全场结束后结算池并 claim。",
            "退款 — 单边或无效池。",
            "Sign-In With Solana — Data Lab ZIP 导出随机数签名（白名单）。",
            "钱包标签 — 余额、历史、每行领取/退款操作。",
          ],
        },
        {
          type: "heading3",
          text: "移动端 Phantom",
        },
        {
          type: "paragraph",
          text: "移动 Chrome/Safari：点击 Wallet → 打开 Phantom → 批准连接与交易 → 返回 Natt Settlement，可在 Reown 账户视图中断开。",
        },
        {
          type: "alert",
          text: "托管仅使用 Solana Devnet。下注前请将 Phantom/Solflare 切换到 Devnet。",
        },
      ],
    },
    {
      id: "wallet-tab",
      title: "钱包标签",
      blocks: [
        {
          type: "list",
          items: ["Reown/Phantom", "SOL/USDC 余额", "投注历史与盈亏", "每行操作按钮"],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "AI 代理（MCP）",
      blocks: [
        { type: "paragraph", text: "20 个 MCP 工具。devnet 钱包可自主下注。" },
        { type: "link", label: "MCP 端点", href: DOCS_MCP_URL },
        { type: "heading3", text: "Cursor" },
        { type: "list", items: ["Connect Agent → Cursor", "先调用 get_pundit_manifest"] },
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
    { id: "fixtures-board", title: "赛程板", blocks: [{ type: "paragraph", text: "TxLINE 赛程。" }] },
    { id: "match-detail", title: "比赛页", blocks: [{ type: "paragraph", text: "托管 + Merkle。" }] },
    { id: "setup-hold", title: "SETUP vs HOLD", blocks: [{ type: "alert", text: "HOLD 是纪律。" }] },
    { id: "datalab", title: "Data Lab", blocks: [{ type: "paragraph", text: "JSONL 导出。" }] },
    { id: "clv", title: "CLV", blocks: [{ type: "paragraph", text: "NOT PROVEN YET。" }] },
    { id: "merkle-settlement", title: "Merkle", blocks: [{ type: "paragraph", text: "TxLINE 结算证明。" }] },
{ id: "activate-txline", title: "激活 TxLINE", blocks: [{ type: "paragraph", text: "/activate" }] },
    { id: "api-reference", title: "API", blocks: [{ type: "list", items: ["GET /mcp-pundit/health"] }] },
    { id: "limitations", title: "限制", blocks: [{ type: "list", items: ["归档比赛请用钱包 claim。"] }] },
    { id: "security", title: "安全", blocks: [{ type: "paragraph", text: "公开 API 隐藏边缘公式。" }] },
  ],
};
