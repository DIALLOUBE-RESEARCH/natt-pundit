import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const enDocs: DocsPack = {
  title: "Documentation",
  lead: "Natt Settlement — complete user guide (wallet, betting, claims, MCP agents).",
  navAria: "Documentation sections",
  sections: [
    {
      id: "introduction",
      title: "What is Natt Settlement?",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement is a TxODDS hackathon product for FIFA World Cup 2026: live TxLINE fixtures, SETUP/HOLD edge diagnostics, Merkle settlement proofs on Solana, and devnet shared-pool escrow betting.",
        },
        {
          type: "paragraph",
          text: "Production Solana wallet UX: Reown AppKit + WalletConnect (Phantom, Solflare, mobile deeplink) — see Wallet integration section.",
        },
        {
          type: "paragraph",
          text: "SETUP flags measurable disagreement between our model and Shin de-vig market consensus. HOLD is a first-class decision — not a failure.",
        },
        {
          type: "link",
          label: "Source code (GitHub)",
          href: DOCS_PUBLIC_REPO,
        },
      ],
    },
    {
      id: "getting-started",
      title: "Getting started",
      blocks: [
        {
          type: "list",
          items: [
            `Open the app: ${DOCS_APP_URL}`,
            "Pick your language in the header (8 locales).",
            "Matches tab — browse fixtures and open a match.",
            "Wallet tab — connect Solana wallet, fund devnet, view bets.",
            "Docs tab — this guide, in your language.",
            "Connect Agent button (header) — link Cursor, Claude, or any MCP client.",
          ],
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "Fund your devnet wallet",
      blocks: [
        {
          type: "alert",
          text: "Escrow bets use Solana Devnet only — not real money. You need devnet SOL (fees) and devnet USDC (stakes).",
        },
        {
          type: "heading3",
          text: "1. Switch wallet to Devnet",
        },
        {
          type: "list",
          items: [
            "Phantom / Solflare: Settings → Developer Settings → Testnet mode → Devnet.",
            "Reown modal: connect any Solana wallet that supports devnet.",
          ],
        },
        {
          type: "heading3",
          text: "2. Get devnet SOL (transaction fees)",
        },
        {
          type: "link",
          label: "Solana faucet — faucet.solana.com",
          href: DOCS_SOL_FAUCET,
        },
        {
          type: "list",
          items: [
            "Paste your wallet address, request SOL (~0.5–2 SOL is enough for many txs).",
            "Minimum recommended: ~0.01 SOL per escrow transaction batch.",
          ],
        },
        {
          type: "heading3",
          text: "3. Get devnet USDC (bet stakes)",
        },
        {
          type: "link",
          label: "Circle faucet — faucet.circle.com (Solana Devnet)",
          href: DOCS_USDC_FAUCET,
        },
        {
          type: "list",
          items: [
            "Select Solana Devnet, paste wallet, request USDC.",
            "Minimum stake per bet: 0.01 USDC.",
            "Devnet USDC mint (reference): 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          ],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "How to bet (escrow)",
      blocks: [
        {
          type: "paragraph",
          text: "Shared pool betting — winners split the pot pro-rata. Not fixed odds like a sportsbook.",
        },
        {
          type: "heading3",
          text: "Fan flow (3 steps)",
        },
        {
          type: "list",
          items: [
            "Wallet — connect Solana wallet (Reown / Phantom).",
            "Place bet — tap the country (flag), or Draw in group stage only. Stake ≥ 0.01 USDC, one tap before kickoff.",
            "After the match — Collect payout on the match page (settlement + claim handled automatically).",
          ],
        },
        {
          type: "heading3",
          text: "Rules",
        },
        {
          type: "list",
          items: [
            "Pre-match only — deposits close at kickoff. No live betting.",
            "Group stage: 1X2 (home / draw / away). Knockout: winner only (ET / penalties if tied).",
            "Shared pool: winners split the pot pro-rata after the official score (not fixed bookmaker odds).",
            "Solo side: only one country backed → refund after kickoff.",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Recover your winnings",
      blocks: [
        {
          type: "paragraph",
          text: "After full time and TxLINE proof validation, tap Collect payout — the app settles the pool if needed and sends winnings to your wallet.",
        },
        {
          type: "heading3",
          text: "From the match page",
        },
        {
          type: "list",
          items: [
            "Open the match → bet slip at the bottom.",
            "Collect payout — after full time if you have a winning or refundable position.",
            "Refund — if pool is unmatched or void.",
          ],
        },
        {
          type: "heading3",
          text: "From the Wallet tab (archived matches)",
        },
        {
          type: "list",
          items: [
            "Wallet → Bet activity — every position is listed even if the match left the board.",
            "Collect payout — claimable or open after kickoff.",
            "Refund stake — if refund eligible.",
          ],
        },
        {
          type: "alert",
          text: "If a finished match disappears from the list, use the Wallet tab — do not rely on the fixtures board alone.",
        },
      ],
    },
    {
      id: "wallet-integration",
      title: "Wallet integration (Solana)",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement ships production-grade wallet UX — not a mock connect button. Fans and agents sign real Solana devnet transactions from the PWA (desktop + mobile).",
        },
        {
          type: "heading3",
          text: "Stack (Solana — not EVM / wagmi)",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — WalletConnect modal (same Reown family as HyperNatt; Solana adapter here).",
            "@reown/appkit-adapter-solana — Phantom, Solflare, WalletConnect on mobile.",
            "Custom Phantom mobile deeplink — connect and sign in Chrome/Safari, return to the app.",
            "Anchor escrow on devnet — SPL USDC deposit, settle, claim, refund.",
          ],
        },
        {
          type: "heading3",
          text: "Signed flows in the app",
        },
        {
          type: "list",
          items: [
            "Place bet — escrow deposit (pre-kickoff).",
            "Collect payout — settle pool + claim winnings after full time.",
            "Refund stake — solo-side or void pools.",
            "Sign-In With Solana — nonce message for Data Lab ZIP export (allowlist).",
            "Wallet tab — balances, bet history, claim/refund on each row.",
          ],
        },
        {
          type: "heading3",
          text: "Mobile Phantom",
        },
        {
          type: "paragraph",
          text: "On mobile Chrome/Safari: tap Wallet → Phantom opens → approve connection and transactions → you return to Natt Settlement with disconnect in the Reown account view.",
        },
        {
          type: "alert",
          text: "Escrow uses Solana Devnet only. Switch Phantom/Solflare to Devnet before betting.",
        },
      ],
    },
    {
      id: "wallet-tab",
      title: "Wallet tab",
      blocks: [
        {
          type: "list",
          items: [
            "Connect wallet — Reown AppKit (Phantom, Solflare, WalletConnect).",
            "Balances — devnet SOL + USDC, refreshed every 30s.",
            "Summary — open positions, total staked, realized / unrealized P&L.",
            "Bet activity — full history with status (Open, Claimable, Won, Lost, Refund).",
            "Action buttons — claim / settle / refund directly on each row.",
            "Gross return vs net P&L — wins show payout (+2 USDC) and net profit (+1 after 1 USDC stake).",
          ],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "Connect an AI agent (MCP)",
      blocks: [
        {
          type: "paragraph",
          text: "20 MCP tools expose fixtures, edge, odds, scores, CLV, Data Lab, escrow tx builders, settle/claim helpers. Agents can bet and recover funds autonomously with a funded devnet wallet.",
        },
        {
          type: "link",
          label: "MCP endpoint",
          href: DOCS_MCP_URL,
        },
        {
          type: "heading3",
          text: "Cursor",
        },
        {
          type: "list",
          items: [
            "Click Connect Agent in the header → Cursor tab → Open in Cursor.",
            "Or add to ~/.cursor/mcp.json manually (see code block below).",
            "Restart Cursor if tools do not appear (Settings → Tools & MCP).",
            "First prompt: call get_pundit_manifest.",
          ],
        },
        {
          type: "code",
          text: `{\n  "mcpServers": {\n    "natt-pundit": {\n      "url": "${DOCS_MCP_URL}"\n    }\n  }\n}`,
        },
        {
          type: "heading3",
          text: "Claude.ai (web)",
        },
        {
          type: "list",
          items: [
            "Connect Agent → Claude tab → copy MCP URL.",
            "Claude.ai → Customize → Connectors → Add custom connector.",
            "Name: Natt Pundit — URL: MCP endpoint — OAuth: leave empty.",
            "New chat → enable connector → get_pundit_manifest.",
          ],
        },
        {
          type: "heading3",
          text: "Claude Code (CLI)",
        },
        {
          type: "code",
          text: `claude mcp add --scope user --transport http natt-pundit ${DOCS_MCP_URL}`,
        },
        {
          type: "heading3",
          text: "Other clients (Windsurf, Claude Desktop, etc.)",
        },
        {
          type: "list",
          items: [
            "Connect Agent → Other tab → copy JSON config or URL.",
            "HTTP transport — URL above, no OAuth for public read tools.",
            "Full MCP setup guide: docs/CURSOR_NATT_PUNDIT_MCP.md (see Source code link in Introduction).",
          ],
        },
        {
          type: "alert",
          text: "x402: some read tools may cost $0.01 devnet USDC. Escrow deposits are separate from MCP fees.",
        },
      ],
    },
    {
      id: "fixtures-board",
      title: "Fixtures board",
      blocks: [
        {
          type: "paragraph",
          text: "Home / Matches lists TxLINE fixtures. Cards poll every 30s. Order: favorites, live, scheduled, finished.",
        },
        {
          type: "list",
          items: [
            "SETUP pill — edge signal.",
            "HOLD — no actionable edge.",
            "Escrow CTA — pool open before kickoff.",
            "Tap card → match detail + escrow panel.",
          ],
        },
      ],
    },
    {
      id: "match-detail",
      title: "Match page",
      blocks: [
        {
          type: "paragraph",
          text: "Timeline, odds ticker, edge verdict, escrow panel, Merkle settlement proof. Refreshes every 10s.",
        },
      ],
    },
    {
      id: "setup-hold",
      title: "SETUP vs HOLD",
      blocks: [
        {
          type: "paragraph",
          text: "Public API exposes verdict, conviction, direction — not raw model internals.",
        },
        { type: "alert", text: "HOLD is discipline. Most fixtures should be HOLD." },
      ],
    },
    {
      id: "datalab",
      title: "Data Lab",
      blocks: [
        {
          type: "paragraph",
          text: "Append-only JSONL streams (odds, scores, edge, proof, ticks). Export ZIP after Sign-In With Solana (allowlisted wallets).",
        },
      ],
    },
    {
      id: "clv",
      title: "Closing Line Value",
      blocks: [
        {
          type: "paragraph",
          text: "CLV certified only after 500+ samples with positive bootstrap bound. Until then: NOT PROVEN YET.",
        },
      ],
    },
    {
      id: "merkle-settlement",
      title: "Merkle & TxLINE proof",
      blocks: [
        {
          type: "paragraph",
          text: "Settlement proofs include Merkle root, leaf, path, local verification. Pending states shown before FT.",
        },
      ],
    },
    {
      id: "activate-txline",
      title: "Activate TxLINE",
      blocks: [
        {
          type: "paragraph",
          text: "/activate — on-chain subscribe + API activation. Token stored on VPS, not in browser.",
        },
      ],
    },
    {
      id: "api-reference",
      title: "Public API",
      blocks: [
        {
          type: "list",
          items: [
            "GET /api/natt-pundit/txline/v1/fixtures",
            "GET /api/natt-pundit/edge/v1/edge/{fixtureId}",
            "GET /api/natt-pundit/txline/v1/fixtures/{id}/proof",
            "GET /mcp-pundit/health",
          ],
        },
      ],
    },
    {
      id: "limitations",
      title: "Known limitations",
      blocks: [
        {
          type: "list",
          items: [
            "CLV not certified until sample gate passes.",
            "Some knockout CPI paths lag if TxLINE stats trail UI score.",
            "Finished matches may leave the board — use Wallet tab for claims.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "Security & transparency",
      blocks: [
        {
          type: "paragraph",
          text: "Edge formula redacted on public REST. Dataset export requires allowlisted wallet. No fake offline scores.",
        },
      ],
    },
  ],
};
