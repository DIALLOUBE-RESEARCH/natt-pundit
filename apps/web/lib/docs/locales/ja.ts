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
          type: "paragraph",
          text: "本番 Solana ウォレット UX：Reown AppKit + WalletConnect（Phantom、Solflare、モバイルディープリンク）—「ウォレット統合」参照。",
        },
        {
          type: "paragraph",
          text: "アプリ全体で8言語 + Stitch ライト/ダークテーマ —「8言語とライト/ダークモード」参照。",
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
      id: "i18n-theme",
      title: "8言語とライト/ダークモード",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement はグローバルな審査員とファン向け — 英語だけではありません。ファン導線全体が翻訳され、Stitch glass UI に本番のライト/ダークテーマがあります。",
        },
        {
          type: "heading3",
          text: "8言語（UI全体）",
        },
        {
          type: "list",
          items: [
            "言語: English, Francais, Espanol, 中文, 日本語, Русский, Portugues, Deutsch.",
            "ヘッダーの言語ピル — 即時切替; URL ?lang=ja.",
            "Docsタブ — 選択言語のこのガイド（ウォレット統合を含む全セクション）。",
            "試合一覧、SETUP/HOLD、ベット、ウォレット、エージェント — 8言語。",
            "HyperNatt と共有 locale (hypernatt_locale)。",
          ],
        },
        {
          type: "heading3",
          text: "ライト / ダーク",
        },
        {
          type: "list",
          items: [
            "テーマ切替 — 左上の太陽/月（iOS風 Stitch glass）。",
            "ブラウザに保存; 全タブに適用。",
            "Reown ウォレットモーダルも同じテーマに同期。",
            "ダーク: slate glass、試合詳細の読みやすいラベル、夜のスタジアム画像。",
            "ライト: 審査用デフォルトデモ。",
          ],
        },
        {
          type: "alert",
          text: "審査のコツ: ?lang=fr&tab=docs、ダークモード、Wallet 接続。",
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
            "試合後「精算中…」(keeper) →「受取」— ウォレット署名1回（claimのみ）",
          ],
        },
        { type: "heading3", text: "ルール" },
        {
          type: "list",
          items: [
            "キックオフ前のみ。共有プール（固定オッズではない）。",
            "オンチェーン・プール未作成の初回ベット：最大 **2回** のウォレット承認（プール作成→デポジット）。同試合の2回目以降は1回。",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "賞金の受取",
      blocks: [
        { type: "paragraph", text: "FT 後、**escrow keeper** がプールを自動 settle。 「受取」表示後にタップ — **claim のみ**、署名1回。" },
        { type: "heading3", text: "試合ページまたはウォレット" },
        {
          type: "list",
          items: ["ウォレット履歴の受取/返金ボタン。", "一覧から消えた試合もウォレットから操作。"],
        },
        { type: "alert", text: "試合が一覧にない場合はウォレットタブを使用。" },
      ],
    },
    {
      id: "wallet-integration",
      title: "ウォレット統合（Solana）",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement は本番品質のウォレット UX を搭載 — モックの接続ボタンではありません。ファンとエージェントが PWA（デスクトップ + モバイル）から実際の Solana devnet トランザクションに署名します。",
        },
        {
          type: "heading3",
          text: "スタック（Solana — EVM / wagmi ではない）",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — WalletConnect モーダル（HyperNatt と同系 Reown、ここは Solana アダプター）。",
            "@reown/appkit-adapter-solana — Phantom、Solflare、モバイル WalletConnect。",
            "カスタム Phantom モバイルディープリンク — Chrome/Safari で接続・署名しアプリに戻る。",
            "devnet Anchor エスクロー — SPL USDC の deposit、settle、claim、refund。",
          ],
        },
        {
          type: "heading3",
          text: "アプリ内の署名フロー",
        },
        {
          type: "list",
          items: [
            "ベット — エスクロー deposit（キックオフ前）。",
            "受取 — keeper の自動 settle 後、**claim のみ**（FT 後）。",
            "返金 — 片側のみまたは void プール。",
            "Sign-In With Solana — Data Lab ZIP エクスポート用 nonce 署名（許可リスト）。",
            "ウォレットタブ — 残高、履歴、各行の claim/refund。",
          ],
        },
        {
          type: "heading3",
          text: "モバイル Phantom",
        },
        {
          type: "paragraph",
          text: "モバイル Chrome/Safari：Wallet をタップ → Phantom が開く → 接続とトランザクションを承認 → Natt Settlement に戻り、Reown アカウント画面で切断可能。",
        },
        {
          type: "alert",
          text: "エスクローは Solana Devnet のみ。ベット前に Phantom/Solflare を Devnet に切り替えてください。",
        },
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
    {
      id: "autonomous-agent-cdp",
      title: "自律エージェント（CDPウォレット）",
      blocks: [
        {
          type: "paragraph",
          text: "ファンはアプリで Phantom/Reown。自律エージェントは同じ MCP で escrow トランザクションを自分の Solana ウォレットで署名 — Natt サーバーに秘密鍵なし。",
        },
        { type: "heading3", text: "流れ" },
        {
          type: "list",
          items: [
            "MCP → ツール → 未署名 tx。",
            "エージェントウォレットが署名 — CDP Server Wallet 推奨。",
            "submit_signed_escrow_tx → done までポール。",
          ],
        },
        { type: "link", label: "デモ dashboard", href: DOCS_AGENT_DASHBOARD_URL },
        { type: "link", label: "MCP manifest", href: DOCS_MCP_INFO_URL },
        { type: "heading3", text: "オプション A — CDP" },
        {
          type: "list",
          items: [
            "Coinbase CDP プロジェクト + CDP_API_KEY_* + CDP_WALLET_SECRET。",
            "Solana devnet 口座 + SOL/USDC 資金。",
          ],
        },
        { type: "link", label: "CDP ポータル", href: DOCS_CDP_PORTAL_URL },
        {
          type: "code",
          text: `node scripts/natt-agent-cdp-autonomous.mjs auto --fixture <ID> --outcome home`,
        },
        { type: "heading3", text: "オプション B — keypair" },
        { type: "list", items: ["natt-agent-autonomous.mjs", "AGENT_WALLET_SECRET"] },
        { type: "alert", text: "公開 repo: docs/AUTONOMOUS_AGENT_CDP.md" },
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
