import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const deDocs: DocsPack = {
  title: "Dokumentation",
  lead: "Natt Settlement — vollstandige Anleitung (Wallet, Wetten, Auszahlung, MCP-Agenten).",
  navAria: "Dokumentationsabschnitte",
  sections: [
    {
      id: "introduction",
      title: "Was ist Natt Settlement?",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement ist ein TxODDS-Hackathon-Produkt fur die WM 2026: live TxLINE-Fixtures, SETUP/HOLD-Edge-Diagnostik, Merkle-Proofs auf Solana und gemeinsame Escrow-Pools auf Devnet.",
        },
        {
          type: "paragraph",
          text: "Produktions-Wallet-UX auf Solana: Reown AppKit + WalletConnect (Phantom, Solflare, Mobile-Deeplink) — siehe Wallet-Integration.",
        },
        {
          type: "link",
          label: "GitHub — DIALLOUBE-RESEARCH/natt-pundit",
          href: DOCS_PUBLIC_REPO,
        },
        {
          type: "paragraph",
          text: "SETUP markiert messbare Abweichung zwischen Modell und Shin-de-vig-Marktkonsens. HOLD ist eine gultige Entscheidung.",
        },
      ],
    },
    {
      id: "getting-started",
      title: "Erste Schritte",
      blocks: [
        {
          type: "list",
          items: [
            `App offnen: ${DOCS_APP_URL}`,
            "Sprache im Header wahlen (8 Sprachen).",
            "Spiele — Fixtures durchsuchen.",
            "Wallet — Solana verbinden, Devnet funden.",
            "Docs — diese Anleitung in deiner Sprache.",
            "Connect Agent — Cursor, Claude oder MCP-Client.",
          ],
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "Devnet-Wallet funden",
      blocks: [
        {
          type: "alert",
          text: "Escrow-Wetten nur auf Solana Devnet — kein echtes Geld. Brauchst Devnet-SOL (Fees) und Devnet-USDC (Einsatze).",
        },
        { type: "heading3", text: "1. Wallet auf Devnet" },
        {
          type: "list",
          items: ["Phantom/Solflare: Einstellungen → Devnet.", "Reown: Solana-Wallet mit Devnet."],
        },
        { type: "heading3", text: "2. Devnet-SOL" },
        { type: "link", label: "Solana Faucet", href: DOCS_SOL_FAUCET },
        { type: "list", items: ["Adresse einfugen, SOL anfordern.", "Min. ~0,01 SOL pro Tx-Batch."] },
        { type: "heading3", text: "3. Devnet-USDC" },
        { type: "link", label: "Circle Faucet", href: DOCS_USDC_FAUCET },
        {
          type: "list",
          items: [
            "Solana Devnet wahlen, USDC anfordern.",
            "Mindesteinsatz: 0,01 USDC.",
            "Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          ],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "Wetten (Escrow)",
      blocks: [
        { type: "paragraph", text: "Gemeinsamer Pool — Gewinner teilen den Pot. Keine festen Buchmacher-Quoten." },
        { type: "heading3", text: "Fan-Ablauf (3 Schritte)" },
        {
          type: "list",
          items: [
            "Wallet verbinden.",
            "Seite + Einsatz wahlen, vor Anpfiff ein Tippen.",
            "Nach Spiel: Auszahlung abholen.",
          ],
        },
        { type: "heading3", text: "Regeln" },
        {
          type: "list",
          items: [
            "Nur Pre-Match.",
            "Gruppe: 1X2. K.o.: nur Sieger.",
            "Geteilter Pool: Gewinner teilen den Pot (keine festen Buchmacher-Quoten).",
            "Nur ein Land gesetzt: Erstattung nach Anpfiff.",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Gewinne abholen",
      blocks: [
        { type: "paragraph", text: "Nach FT «Auszahlung abholen» — Settle + Claim automatisch." },
        { type: "heading3", text: "Spielseite" },
        { type: "list", items: ["Wettschein unten: Abholen oder Erstattung."] },
        { type: "heading3", text: "Wallet-Tab (archivierte Spiele)" },
        {
          type: "list",
          items: [
            "Alle Positionen sichtbar.",
            "Abholen / Erstattung pro Zeile.",
          ],
        },
        { type: "alert", text: "Verschwundene Spiele: Wallet-Tab nutzen!" },
      ],
    },
    {
      id: "wallet-integration",
      title: "Wallet-Integration (Solana)",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement liefert produktionsreife Wallet-UX — kein Mock-Connect-Button. Fans und Agenten signieren echte Solana-Devnet-Transaktionen in der PWA (Desktop + Mobil).",
        },
        {
          type: "heading3",
          text: "Stack (Solana — nicht EVM / wagmi)",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — WalletConnect-Modal (gleiche Reown-Familie wie HyperNatt; hier Solana-Adapter).",
            "@reown/appkit-adapter-solana — Phantom, Solflare, WalletConnect mobil.",
            "Custom Phantom-Mobile-Deeplink — Connect + Sign in Chrome/Safari, Ruckkehr in die App.",
            "Anchor-Escrow auf Devnet — SPL-USDC deposit, settle, claim, refund.",
          ],
        },
        {
          type: "heading3",
          text: "Signierte Ablaufe in der App",
        },
        {
          type: "list",
          items: [
            "Wette platzieren — Escrow-Deposit (Pre-Match).",
            "Auszahlung abholen — Pool settle + Gewinn-Claim nach FT.",
            "Einsatz erstatten — Solo-Seite oder void Pool.",
            "Sign-In With Solana — Nonce-Nachricht fur Data-Lab-ZIP-Export (Allowlist).",
            "Wallet-Tab — Salden, Historie, Claim/Refund pro Zeile.",
          ],
        },
        {
          type: "heading3",
          text: "Phantom mobil",
        },
        {
          type: "paragraph",
          text: "Mobil in Chrome/Safari: Wallet tippen → Phantom offnet sich → Verbindung und Transaktionen bestatigen → zuruck in Natt Settlement mit Disconnect in der Reown-Kontoansicht.",
        },
        {
          type: "alert",
          text: "Escrow nur auf Solana Devnet. Phantom/Solflare vor dem Wetten auf Devnet schalten.",
        },
      ],
    },
    {
      id: "wallet-tab",
      title: "Wallet-Tab",
      blocks: [
        {
          type: "list",
          items: [
            "Reown/Phantom verbinden.",
            "SOL+USDC Salden.",
            "P&L und Wett-Historie.",
            "Aktionen direkt in der Liste.",
          ],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "KI-Agent (MCP)",
      blocks: [
        { type: "paragraph", text: "20 MCP-Tools fur Fixtures, Edge, Escrow-Txs, Settle/Claim." },
        { type: "link", label: "MCP Endpoint", href: DOCS_MCP_URL },
        { type: "heading3", text: "Cursor" },
        {
          type: "list",
          items: ["Connect Agent → Cursor.", "~/.cursor/mcp.json", "get_pundit_manifest zuerst."],
        },
        {
          type: "code",
          text: `{\n  "mcpServers": {\n    "natt-pundit": {\n      "url": "${DOCS_MCP_URL}"\n    }\n  }\n}`,
        },
        { type: "heading3", text: "Claude.ai" },
        { type: "list", items: ["Connector: Natt Pundit, URL, OAuth leer."] },
        { type: "heading3", text: "Claude Code" },
        {
          type: "code",
          text: `claude mcp add --scope user --transport http natt-pundit ${DOCS_MCP_URL}`,
        },
        { type: "alert", text: "x402: 0,01 USDC devnet pro Tool moglich." },
      ],
    },
    {
      id: "fixtures-board",
      title: "Spiele-Board",
      blocks: [{ type: "paragraph", text: "TxLINE-Fixtures, 30s Poll." }],
    },
    { id: "match-detail", title: "Spielseite", blocks: [{ type: "paragraph", text: "Timeline, Quoten, Escrow, Merkle." }] },
    {
      id: "setup-hold",
      title: "SETUP vs HOLD",
      blocks: [{ type: "alert", text: "HOLD ist Disziplin." }],
    },
    { id: "datalab", title: "Data Lab", blocks: [{ type: "paragraph", text: "JSONL-Export mit SIWS." }] },
    { id: "clv", title: "CLV", blocks: [{ type: "paragraph", text: "NOT PROVEN YET bis 500+ Samples." }] },
    { id: "merkle-settlement", title: "Merkle", blocks: [{ type: "paragraph", text: "TxLINE Settlement-Proof." }] },
{ id: "activate-txline", title: "TxLINE aktivieren", blocks: [{ type: "paragraph", text: "/activate Route." }] },
    {
      id: "api-reference",
      title: "API",
      blocks: [{ type: "list", items: ["GET /api/natt-pundit/txline/v1/fixtures", "GET /mcp-pundit/health"] }],
    },
    {
      id: "limitations",
      title: "Grenzen",
      blocks: [{ type: "list", items: ["Archivierte Spiele: Wallet-Tab."] }],
    },
    { id: "security", title: "Sicherheit", blocks: [{ type: "paragraph", text: "Edge-Formel redacted." }] },
  ],
};
