import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const jaDocs: DocsPack = {
  title: "ドキュメント",
  lead: "Natt Settlement — 完全ユーザーガイド（ウォレット・ベット・受取・MCPエージェント）。",
  navAria: "ドキュメントセクション",
  sections: [
    {
      id: "introduction",
      title: "Natt Settlement とは",
      blocks: [
        {
          type: "paragraph",
          text: "2026 FIFA W杯向け TxODDS ハッカソン製品：TxLINE 試合、SETUP/HOLD エッジ、Solana Merkle 証明、devnet 共有プール・エスクロー。",
        },
        {
          type: "link",
          label: "GitHub — DIALLOUBE-RESEARCH/natt-pundit",
          href: DOCS_PUBLIC_REPO,
        },
        { type: "paragraph", text: "SETUP は市場との measurable な乖離。HOLD も正当な判断です。" },
      ],
    },
    {
      id: "getting-started",
      title: "はじめに",
      blocks: [
        {
          type: "list",
          items: [
            `アプリ: ${DOCS_APP_URL}`,
            "ヘッダーで言語選択（8言語）。",
            "試合タブ — フィクスチャ一覧。",
            "ウォレット — Solana 接続・devnet 資金。",
            "Docs — このガイド（選択言語）。",
            "Connect Agent — Cursor / Claude / MCP。",
          ],
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "devnet ウォレットの資金",
      blocks: [
        { type: "alert", text: "エスクローは Solana Devnet のみ。SOL（手数料）と USDC（賭け金）が必要。" },
        { type: "heading3", text: "1. Devnet に切替" },
        { type: "list", items: ["Phantom: 設定 → Devnet。"] },
        { type: "heading3", text: "2. devnet SOL" },
        { type: "link", label: "Solana ファウセット", href: DOCS_SOL_FAUCET },
        { type: "heading3", text: "3. devnet USDC" },
        { type: "link", label: "Circle ファウセット", href: DOCS_USDC_FAUCET },
        {
          type: "list",
          items: ["最低賭け金 0.01 USDC。", "Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "ベット方法（エスクロー）",
      blocks: [
        { type: "paragraph", text: "共有プール賭け — 勝者がポットを按分。" },
        {
          type: "list",
          items: [
            "ウォレット接続",
            "キックオフ前にサイド + 金額を選びワンタップでベット",
            "試合後「受取」",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "賞金の受取",
      blocks: [
        { type: "paragraph", text: "FT 後「受取」をタップ — アプリが settle + claim をまとめて処理。" },
        { type: "heading3", text: "試合ページまたはウォレット" },
        {
          type: "list",
          items: ["ウォレット履歴の受取/返金ボタン。", "一覧から消えた試合もウォレットから操作。"],
        },
        { type: "alert", text: "試合が一覧にない場合はウォレットタブを使用。" },
      ],
    },
    {
      id: "wallet-tab",
      title: "ウォレットタブ",
      blocks: [
        {
          type: "list",
          items: ["Reown/Phantom", "SOL/USDC 残高", "ベット履歴と P&L", "各行のアクションボタン"],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "AI エージェント（MCP）",
      blocks: [
        { type: "paragraph", text: "MCP ツール 20 個。devnet ウォレットで自律ベット可能。" },
        { type: "link", label: "MCP エンドポイント", href: DOCS_MCP_URL },
        { type: "heading3", text: "Cursor" },
        { type: "list", items: ["Connect Agent → Cursor", "最初に get_pundit_manifest"] },
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
    { id: "fixtures-board", title: "試合一覧", blocks: [{ type: "paragraph", text: "TxLINE フィクスチャ。" }] },
    { id: "match-detail", title: "試合ページ", blocks: [{ type: "paragraph", text: "エスクロー + Merkle。" }] },
    { id: "setup-hold", title: "SETUP vs HOLD", blocks: [{ type: "alert", text: "HOLD は規律。" }] },
    { id: "datalab", title: "Data Lab", blocks: [{ type: "paragraph", text: "JSONL エクスポート。" }] },
    { id: "clv", title: "CLV", blocks: [{ type: "paragraph", text: "NOT PROVEN YET。" }] },
    { id: "merkle-settlement", title: "Merkle", blocks: [{ type: "paragraph", text: "TxLINE 決済証明。" }] },
{ id: "activate-txline", title: "TxLINE 有効化", blocks: [{ type: "paragraph", text: "/activate" }] },
    { id: "api-reference", title: "API", blocks: [{ type: "list", items: ["GET /mcp-pundit/health"] }] },
    { id: "limitations", title: "制限", blocks: [{ type: "list", items: ["アーカイブ試合はウォレットから claim。"] }] },
    { id: "security", title: "セキュリティ", blocks: [{ type: "paragraph", text: "公開 API ではエッジ式を秘匿。" }] },
  ],
};
