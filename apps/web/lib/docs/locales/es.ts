import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const esDocs: DocsPack = {
  title: "Documentacion",
  lead: "Natt Settlement — guia completa (wallet, apuestas, cobros, agentes MCP).",
  navAria: "Secciones de documentacion",
  sections: [
    {
      id: "introduction",
      title: "Que es Natt Settlement?",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement es un producto hackathon TxODDS para el Mundial 2026: fixtures TxLINE en vivo, diagnostico edge SETUP/HOLD, pruebas Merkle en Solana y pools escrow de bote compartido en devnet.",
        },
        {
          type: "paragraph",
          text: "UX wallet Solana de produccion: Reown AppKit + WalletConnect (Phantom, Solflare, deeplink movil) — ver Integracion wallet.",
        },
        {
          type: "link",
          label: "GitHub — DIALLOUBE-RESEARCH/natt-pundit",
          href: DOCS_PUBLIC_REPO,
        },
        {
          type: "paragraph",
          text: "SETUP marca desacuerdo medible entre nuestro modelo y el consenso de mercado Shin de-vig. HOLD es una decision valida, no un fallo.",
        },
      ],
    },
    {
      id: "getting-started",
      title: "Primeros pasos",
      blocks: [
        {
          type: "list",
          items: [
            `Abre la app: ${DOCS_APP_URL}`,
            "Elige idioma en el header (8 idiomas).",
            "Pestana Partidos — explora fixtures y abre un partido.",
            "Pestana Wallet — conecta wallet Solana, fondos devnet, historial.",
            "Pestana Docs — esta guia en tu idioma.",
            "Boton Connect Agent — enlaza Cursor, Claude u otro cliente MCP.",
          ],
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "Fondear wallet devnet",
      blocks: [
        {
          type: "alert",
          text: "Las apuestas escrow usan solo Solana Devnet — no dinero real. Necesitas SOL devnet (fees) y USDC devnet (stakes).",
        },
        { type: "heading3", text: "1. Cambiar wallet a Devnet" },
        {
          type: "list",
          items: [
            "Phantom / Solflare: Ajustes → Developer Settings → Testnet → Devnet.",
            "Modal Reown: conecta wallet Solana compatible devnet.",
          ],
        },
        { type: "heading3", text: "2. Obtener SOL devnet" },
        { type: "link", label: "Faucet Solana", href: DOCS_SOL_FAUCET },
        {
          type: "list",
          items: [
            "Pega tu direccion, solicita SOL (~0,5–2 SOL).",
            "Minimo recomendado: ~0,01 SOL por lote de txs escrow.",
          ],
        },
        { type: "heading3", text: "3. Obtener USDC devnet" },
        { type: "link", label: "Faucet Circle (Solana Devnet)", href: DOCS_USDC_FAUCET },
        {
          type: "list",
          items: [
            "Selecciona Solana Devnet, pega wallet, solicita USDC.",
            "Apuesta minima: 0,01 USDC.",
            "Mint USDC devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          ],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "Como apostar (escrow)",
      blocks: [
        {
          type: "paragraph",
          text: "Apuestas en pool compartido — los ganadores comparten el bote. No son cuotas fijas de casa de apuestas.",
        },
        { type: "heading3", text: "Flujo fan (3 pasos)" },
        {
          type: "list",
          items: [
            "Wallet — conecta Solana (Reown / Phantom).",
            "Apostar — toca el pais (bandera) o Empate en fase de grupos. ≥ 0,01 USDC, un toque antes del kickoff.",
            "Tras el partido — Cobrar en la pagina del partido (settlement + claim automaticos).",
          ],
        },
        { type: "heading3", text: "Reglas" },
        {
          type: "list",
          items: [
            "Solo pre-partido — depositos cierran al kickoff.",
            "Fase de grupos: 1X2. Eliminatoria: solo ganador (prorroga / penaltis).",
            "Pool compartido: ganadores reparten el bote (no cuotas fijas de casa).",
            "Solo un pais apostado: reembolso tras el kickoff.",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Recuperar ganancias",
      blocks: [
        {
          type: "paragraph",
          text: "Tras el tiempo reglamentario y prueba TxLINE, pulsa Cobrar — la app settlea si hace falta y envia ganancias a tu wallet.",
        },
        { type: "heading3", text: "Desde la pagina del partido" },
        {
          type: "list",
          items: [
            "Abre partido → ticket de apuesta abajo.",
            "Cobrar — tras el partido si tienes posicion ganadora o reembolsable.",
            "Reembolso — pool unmatched o void.",
          ],
        },
        { type: "heading3", text: "Desde Wallet (partidos archivados)" },
        {
          type: "list",
          items: [
            "Wallet → Actividad — todas las posiciones, aunque el partido salga del listado.",
            "Cobrar — reclamable o abierta tras kickoff.",
            "Reembolso — si elegible.",
          ],
        },
        {
          type: "alert",
          text: "Si un partido terminado desaparece del listado, usa Wallet — no solo el board.",
        },
      ],
    },
    {
      id: "wallet-integration",
      title: "Integracion wallet (Solana)",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement incluye UX wallet de produccion — no un boton connect falso. Fans y agentes firman transacciones reales en Solana devnet desde la PWA (escritorio + movil).",
        },
        {
          type: "heading3",
          text: "Stack (Solana — no EVM / wagmi)",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — modal WalletConnect (misma familia Reown que HyperNatt; adaptador Solana aqui).",
            "@reown/appkit-adapter-solana — Phantom, Solflare, WalletConnect movil.",
            "Deeplink Phantom movil custom — conectar y firmar en Chrome/Safari, volver a la app.",
            "Escrow Anchor en devnet — deposito SPL USDC, settle, claim, refund.",
          ],
        },
        {
          type: "heading3",
          text: "Flujos firmados en la app",
        },
        {
          type: "list",
          items: [
            "Apostar — deposito escrow (pre-partido).",
            "Cobrar — settle del pool + claim tras el FT.",
            "Reembolso — lado solo o pool void.",
            "Sign-In With Solana — nonce para export ZIP Data Lab (allowlist).",
            "Pestana Wallet — saldos, historial, claim/refund por fila.",
          ],
        },
        {
          type: "heading3",
          text: "Phantom movil",
        },
        {
          type: "paragraph",
          text: "En Chrome/Safari movil: toca Wallet → se abre Phantom → aprueba conexion y transacciones → vuelves a Natt Settlement con disconnect en la vista cuenta Reown.",
        },
        {
          type: "alert",
          text: "El escrow usa solo Solana Devnet. Cambia Phantom/Solflare a Devnet antes de apostar.",
        },
      ],
    },
    {
      id: "wallet-tab",
      title: "Pestana Wallet",
      blocks: [
        {
          type: "list",
          items: [
            "Conectar wallet — Reown (Phantom, Solflare, WalletConnect).",
            "Saldos — SOL + USDC devnet, cada 30 s.",
            "Resumen — posiciones abiertas, total apostado, P&L.",
            "Actividad — historial con estado y botones claim/settle/refund.",
            "Retorno bruto vs P&L neto en victorias.",
          ],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "Conectar agente IA (MCP)",
      blocks: [
        {
          type: "paragraph",
          text: "20 herramientas MCP: fixtures, edge, cuotas, scores, CLV, Data Lab, txs escrow, settle/claim. Un agente puede apostar y cobrar con wallet devnet.",
        },
        { type: "link", label: "Endpoint MCP", href: DOCS_MCP_URL },
        { type: "heading3", text: "Cursor" },
        {
          type: "list",
          items: [
            "Connect Agent → Cursor → Abrir en Cursor.",
            "O anade a ~/.cursor/mcp.json manualmente.",
            "Reinicia Cursor si no ves herramientas.",
            "Primer prompt: get_pundit_manifest.",
          ],
        },
        {
          type: "code",
          text: `{\n  "mcpServers": {\n    "natt-pundit": {\n      "url": "${DOCS_MCP_URL}"\n    }\n  }\n}`,
        },
        { type: "heading3", text: "Claude.ai (web)" },
        {
          type: "list",
          items: [
            "Connect Agent → Claude → copia URL MCP.",
            "Claude.ai → Conectores → Anadir conector personalizado.",
            "Nombre: Natt Pundit — URL MCP — OAuth vacio.",
          ],
        },
        { type: "heading3", text: "Claude Code (CLI)" },
        {
          type: "code",
          text: `claude mcp add --scope user --transport http natt-pundit ${DOCS_MCP_URL}`,
        },
        { type: "heading3", text: "Otros clientes" },
        {
          type: "list",
          items: [
            "Connect Agent → Otro → copia JSON o URL.",
            "Transporte HTTP — URL arriba, sin OAuth para lecturas publicas.",
            "Guia MCP: docs/CURSOR_NATT_PUNDIT_MCP.md (enlace codigo fuente en Introduccion).",
          ],
        },
        {
          type: "alert",
          text: "x402: algunas lecturas cuestan 0,01 USDC devnet. Deposits escrow separados de fees MCP.",
        },
      ],
    },
    {
      id: "fixtures-board",
      title: "Tablero de partidos",
      blocks: [
        {
          type: "paragraph",
          text: "Inicio / Partidos lista fixtures TxLINE. Poll 30 s.",
        },
        {
          type: "list",
          items: ["Pill SETUP", "HOLD", "CTA Escrow", "Tap → detalle"],
        },
      ],
    },
    {
      id: "match-detail",
      title: "Pagina del partido",
      blocks: [{ type: "paragraph", text: "Timeline, cuotas, edge, escrow, prueba Merkle." }],
    },
    {
      id: "setup-hold",
      title: "SETUP vs HOLD",
      blocks: [
        { type: "paragraph", text: "API publica: verdict, conviction, direction." },
        { type: "alert", text: "HOLD es disciplina." },
      ],
    },
    {
      id: "datalab",
      title: "Data Lab",
      blocks: [{ type: "paragraph", text: "JSONL append-only. Export ZIP con wallet allowlist." }],
    },
    {
      id: "clv",
      title: "Closing Line Value",
      blocks: [{ type: "paragraph", text: "CLV certificado tras 500+ muestras. Hasta entonces: NOT PROVEN YET." }],
    },
    {
      id: "merkle-settlement",
      title: "Merkle y prueba TxLINE",
      blocks: [{ type: "paragraph", text: "Raiz Merkle, hoja, ruta, verificacion local." }      ],
    },
    {
      id: "activate-txline",
      title: "Activar TxLINE",
      blocks: [{ type: "paragraph", text: "/activate — suscripcion on-chain + API." }],
    },
    {
      id: "api-reference",
      title: "API publica",
      blocks: [
        {
          type: "list",
          items: [
            "GET /api/natt-pundit/txline/v1/fixtures",
            "GET /api/natt-pundit/edge/v1/edge/{fixtureId}",
            "GET /mcp-pundit/health",
          ],
        },
      ],
    },
    {
      id: "limitations",
      title: "Limitaciones",
      blocks: [
        {
          type: "list",
          items: [
            "CLV no certificado aun.",
            "Partidos archivados: usa Wallet para claims.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "Seguridad",
      blocks: [{ type: "paragraph", text: "Formula edge redactada. Export con wallet allowlist." }],
    },
  ],
};
