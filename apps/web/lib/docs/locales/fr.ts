import type { DocsPack } from "../types";
import {
  DOCS_APP_URL,
  DOCS_MCP_URL,
  DOCS_PUBLIC_REPO,
  DOCS_SOL_FAUCET,
  DOCS_USDC_FAUCET,
} from "../urls";

export const frDocs: DocsPack = {
  title: "Documentation",
  lead: "Natt Settlement — guide utilisateur complet (wallet, paris, gains, agents MCP).",
  navAria: "Sections documentation",
  sections: [
    {
      id: "introduction",
      title: "C'est quoi Natt Settlement ?",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement est un produit hackathon TxODDS pour la Coupe du Monde 2026 : fixtures TxLINE live, diagnostics edge SETUP/HOLD, preuves Merkle sur Solana, et paris escrow en pool partage en devnet.",
        },
        {
          type: "paragraph",
          text: "UX wallet Solana de prod : Reown AppKit + WalletConnect (Phantom, Solflare, deeplink mobile) — voir la section Integration wallet.",
        },
        {
          type: "paragraph",
          text: "8 langues + theme clair/sombre Stitch sur toute l'app — voir la section 8 langues & mode clair/sombre.",
        },
        {
          type: "paragraph",
          text: "SETUP signale un desaccord mesurable entre notre modele et le consensus marche Shin de-vig. HOLD est une decision de premier plan — pas un echec.",
        },
        {
          type: "link",
          label: "Code source (GitHub)",
          href: DOCS_PUBLIC_REPO,
        },
      ],
    },
    {
      id: "getting-started",
      title: "Demarrage rapide",
      blocks: [
        {
          type: "list",
          items: [
            `Ouvre l'app : ${DOCS_APP_URL}`,
            "Choisis ta langue dans le header (8 langues).",
            "Onglet Matchs — parcours les fixtures et ouvre un match.",
            "Onglet Wallet — connecte ton wallet Solana, finance le devnet, vois tes paris.",
            "Onglet Docs — ce guide, dans ta langue.",
            "Bouton Connect Agent (header) — lie Cursor, Claude ou tout client MCP.",
          ],
        },
      ],
    },
    {
      id: "i18n-theme",
      title: "8 langues & mode clair/sombre",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement est pense pour un jury et des fans internationaux — pas que l'anglais. Tout le parcours fan est traduit et l'UI Stitch glass inclut un theme clair/sombre de prod.",
        },
        {
          type: "heading3",
          text: "8 langues (UI complete)",
        },
        {
          type: "list",
          items: [
            "Locales : English, Francais, Espanol, 中文, 日本語, Русский, Portugues, Deutsch.",
            "Pill langue dans le header — switch instantane ; URL ?lang=fr (en, fr, es, zh, ja, ru, pt, de).",
            "Onglet Docs — ce manuel suit ta langue (toutes les sections, dont Integration wallet).",
            "Board matchs, SETUP/HOLD, slip pari, wallet, modale agent — les 8 langues.",
            "Stockage locale partage avec HyperNatt (hypernatt_locale) pour coherence cross-app.",
          ],
        },
        {
          type: "heading3",
          text: "Mode clair / sombre",
        },
        {
          type: "list",
          items: [
            "Toggle theme — switch soleil/lune en haut a gauche (glass Stitch style iOS).",
            "Persiste dans le navigateur ; s'applique a tous les onglets (Accueil, Matchs, Docs, Wallet).",
            "La modale wallet Reown suit le meme theme (sync light/dark a l'ouverture).",
            "Mode sombre : surfaces slate glass, labels lisibles sur detail match, visuels stade nuit.",
            "Mode clair : demo jury par defaut — hero WC et cartes match inchanges.",
          ],
        },
        {
          type: "alert",
          text: "Tip jury : ouvre ?lang=es&tab=docs, passe en mode sombre, puis connecte Wallet — i18n + theme + stack Reown en un flux.",
        },
      ],
    },
    {
      id: "devnet-funds",
      title: "Financer ton wallet devnet",
      blocks: [
        {
          type: "alert",
          text: "Les paris escrow utilisent Solana Devnet uniquement — pas d'argent reel. Il te faut du SOL devnet (frais) et de l'USDC devnet (mises).",
        },
        {
          type: "heading3",
          text: "1. Passer le wallet en Devnet",
        },
        {
          type: "list",
          items: [
            "Phantom / Solflare : Parametres → Developer Settings → Testnet mode → Devnet.",
            "Modal Reown : connecte un wallet Solana compatible devnet.",
          ],
        },
        {
          type: "heading3",
          text: "2. Obtenir du SOL devnet (frais de transaction)",
        },
        {
          type: "link",
          label: "Faucet Solana — faucet.solana.com",
          href: DOCS_SOL_FAUCET,
        },
        {
          type: "list",
          items: [
            "Colle ton adresse wallet, demande du SOL (~0,5–2 SOL suffisent pour beaucoup de txs).",
            "Minimum recommande : ~0,01 SOL par lot de transactions escrow.",
          ],
        },
        {
          type: "heading3",
          text: "3. Obtenir de l'USDC devnet (mises)",
        },
        {
          type: "link",
          label: "Faucet Circle — faucet.circle.com (Solana Devnet)",
          href: DOCS_USDC_FAUCET,
        },
        {
          type: "list",
          items: [
            "Selectionne Solana Devnet, colle le wallet, demande de l'USDC.",
            "Mise minimum par pari : 0,01 USDC.",
            "Mint USDC devnet (reference) : 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          ],
        },
      ],
    },
    {
      id: "betting-escrow",
      title: "Comment parier (escrow)",
      blocks: [
        {
          type: "paragraph",
          text: "Paris en pool partage — les gagnants se partagent la cagnotte au prorata. Ce ne sont pas des cotes fixes comme un bookmaker.",
        },
        {
          type: "heading3",
          text: "Parcours fan (3 etapes)",
        },
        {
          type: "list",
          items: [
            "Wallet — connecte un wallet Solana (Reown / Phantom).",
            "Parier — tape sur le pays (drapeau), ou Nul en phase de groupes. Mise ≥ 0,01 USDC, un bouton avant le coup d'envoi.",
            "Apres le match — Encaisser sur la page match (settlement + claim automatiques).",
          ],
        },
        {
          type: "heading3",
          text: "Regles",
        },
        {
          type: "list",
          items: [
            "Pre-match uniquement — depots fermes au coup d'envoi. Pas de pari live.",
            "Phase de groupes : 1X2. Elimination directe : vainqueur seul (prolongations / tirs au but si egalite).",
            "Pool partage : les gagnants se partagent la cagnotte au prorata (pas des cotes fixes bookmaker).",
            "Seul un pays mise : remboursement apres coup d'envoi.",
          ],
        },
      ],
    },
    {
      id: "claim-settle",
      title: "Recuperer tes gains",
      blocks: [
        {
          type: "paragraph",
          text: "Apres le temps reglementaire et validation TxLINE, appuie sur Encaisser — l'app settle le pool si besoin et envoie les gains sur ton wallet.",
        },
        {
          type: "heading3",
          text: "Depuis la page match",
        },
        {
          type: "list",
          items: [
            "Ouvre le match → ticket de pari en bas.",
            "Encaisser — apres le coup d'envoi si tu as une position gagnante ou remboursable.",
            "Rembourser — si pool unmatched ou void.",
          ],
        },
        {
          type: "heading3",
          text: "Depuis l'onglet Wallet (matchs archives)",
        },
        {
          type: "list",
          items: [
            "Wallet → Activite paris — chaque position est listee meme si le match a quitte le board.",
            "Encaisser — a reclamer ou ouvert apres coup d'envoi.",
            "Rembourser mise — si remboursement eligible.",
          ],
        },
        {
          type: "alert",
          text: "Si un match termine disparait de la liste, utilise l'onglet Wallet — ne compte pas sur le board des matchs seul.",
        },
      ],
    },
    {
      id: "wallet-integration",
      title: "Integration wallet (Solana)",
      blocks: [
        {
          type: "paragraph",
          text: "Natt Settlement integre une UX wallet de prod — pas un faux bouton connect. Fans et agents signent de vraies transactions Solana devnet depuis la PWA (desktop + mobile).",
        },
        {
          type: "heading3",
          text: "Stack (Solana — pas EVM / wagmi)",
        },
        {
          type: "list",
          items: [
            "Reown AppKit — modale WalletConnect (meme famille Reown qu'HyperNatt ; adaptateur Solana ici).",
            "@reown/appkit-adapter-solana — Phantom, Solflare, WalletConnect mobile.",
            "Deeplink Phantom mobile custom — connect + sign dans Chrome/Safari, retour dans l'app.",
            "Escrow Anchor sur devnet — depot SPL USDC, settle, claim, refund.",
          ],
        },
        {
          type: "heading3",
          text: "Flux signes dans l'app",
        },
        {
          type: "list",
          items: [
            "Parier — depot escrow (avant coup d'envoi).",
            "Encaisser — settle du pool + claim des gains apres FT.",
            "Remboursement — cote solo ou pool void.",
            "Sign-In With Solana — message nonce pour export ZIP Data Lab (allowlist).",
            "Onglet Wallet — soldes, historique, claim/refund sur chaque ligne.",
          ],
        },
        {
          type: "heading3",
          text: "Phantom mobile",
        },
        {
          type: "paragraph",
          text: "Sur Chrome/Safari mobile : tap Wallet → Phantom s'ouvre → approuve connexion et transactions → tu reviens dans Natt Settlement avec disconnect dans la vue compte Reown.",
        },
        {
          type: "alert",
          text: "L'escrow utilise uniquement Solana Devnet. Passe Phantom/Solflare en Devnet avant de parier.",
        },
      ],
    },
    {
      id: "wallet-tab",
      title: "Onglet Wallet",
      blocks: [
        {
          type: "list",
          items: [
            "Connecter wallet — Reown AppKit (Phantom, Solflare, WalletConnect).",
            "Soldes — SOL + USDC devnet, rafraichis toutes les 30 s.",
            "Resume — positions ouvertes, total mise, P&L realise / latent.",
            "Activite paris — historique complet avec statut (Ouvert, A reclamer, Gagne, Perdu, Remboursement).",
            "Boutons d'action — claim / settle / refund directement sur chaque ligne.",
            "Retour brut vs P&L net — les gains affichent le payout (+2 USDC) et le profit net (+1 apres mise 1 USDC).",
          ],
        },
      ],
    },
    {
      id: "connect-agent",
      title: "Connecter un agent IA (MCP)",
      blocks: [
        {
          type: "paragraph",
          text: "20 outils MCP exposent fixtures, edge, cotes, scores, CLV, Data Lab, builders tx escrow, helpers settle/claim. Un agent peut parier et recuperer des fonds en autonomie avec un wallet devnet finance.",
        },
        {
          type: "link",
          label: "Endpoint MCP",
          href: DOCS_MCP_URL,
        },
        {
          type: "heading3",
          text: "Cursor",
        },
        {
          type: "list",
          items: [
            "Clique Connect Agent dans le header → onglet Cursor → Ouvrir dans Cursor.",
            "Ou ajoute manuellement dans ~/.cursor/mcp.json (voir bloc ci-dessous).",
            "Redemarre Cursor si les outils n'apparaissent pas (Settings → Tools & MCP).",
            "Premier prompt : appelle get_pundit_manifest.",
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
            "Connect Agent → onglet Claude → copie l'URL MCP.",
            "Claude.ai → Personnaliser → Connecteurs → Ajouter un connecteur personnalise.",
            "Nom : Natt Pundit — URL : endpoint MCP — OAuth : laisser vide.",
            "Nouveau chat → activer le connecteur → get_pundit_manifest.",
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
          text: "Autres clients (Windsurf, Claude Desktop, etc.)",
        },
        {
          type: "list",
          items: [
            "Connect Agent → onglet Autre → copie la config JSON ou l'URL.",
            "Transport HTTP, pas d'OAuth pour les outils lecture publics.",
            "Guide MCP complet : docs/CURSOR_NATT_PUNDIT_MCP.md (lien code source dans Introduction).",
          ],
        },
        {
          type: "alert",
          text: "x402 : certains outils lecture peuvent couter 0,01 USDC devnet. Les depots escrow sont separes des frais MCP.",
        },
      ],
    },
    {
      id: "fixtures-board",
      title: "Board des matchs",
      blocks: [
        {
          type: "paragraph",
          text: "Accueil / Matchs liste les fixtures TxLINE. Cartes poll toutes les 30 s. Ordre : favoris, live, programme, termine.",
        },
        {
          type: "list",
          items: [
            "Pill SETUP — signal edge.",
            "HOLD — pas d'edge actionnable.",
            "CTA Escrow — pool ouvert avant coup d'envoi.",
            "Tap carte → detail match + panneau escrow.",
          ],
        },
      ],
    },
    {
      id: "match-detail",
      title: "Page match",
      blocks: [
        {
          type: "paragraph",
          text: "Timeline, ticker cotes, verdict edge, panneau escrow, preuve Merkle. Rafraichissement toutes les 10 s.",
        },
      ],
    },
    {
      id: "setup-hold",
      title: "SETUP vs HOLD",
      blocks: [
        {
          type: "paragraph",
          text: "L'API publique expose verdict, conviction, direction — pas les internals du modele.",
        },
        { type: "alert", text: "HOLD c'est de la discipline. La plupart des matchs doivent etre HOLD." },
      ],
    },
    {
      id: "datalab",
      title: "Data Lab",
      blocks: [
        {
          type: "paragraph",
          text: "Flux JSONL append-only (cotes, scores, edge, preuve, ticks). Export ZIP apres Sign-In With Solana (wallets allowlist).",
        },
      ],
    },
    {
      id: "clv",
      title: "Closing Line Value",
      blocks: [
        {
          type: "paragraph",
          text: "CLV certifie seulement apres 500+ echantillons avec borne bootstrap positive. Sinon : NOT PROVEN YET.",
        },
      ],
    },
    {
      id: "merkle-settlement",
      title: "Merkle & preuve TxLINE",
      blocks: [
        {
          type: "paragraph",
          text: "Preuves de settlement : racine Merkle, feuille, chemin, verification locale. Etats pending avant FT.",
        },
      ],
    },
    {
      id: "activate-txline",
      title: "Activer TxLINE",
      blocks: [
        {
          type: "paragraph",
          text: "/activate — abonnement on-chain + activation API. Token stocke sur VPS, pas dans le navigateur.",
        },
      ],
    },
    {
      id: "api-reference",
      title: "API publique",
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
      title: "Limitations connues",
      blocks: [
        {
          type: "list",
          items: [
            "CLV non certifie tant que le gate echantillon n'est pas passe.",
            "Certains chemins CPI knockout en retard si stats TxLINE traînent derriere le score UI.",
            "Matchs termines peuvent quitter le board — utilise l'onglet Wallet pour les claims.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "Securite & transparence",
      blocks: [
        {
          type: "paragraph",
          text: "Formule edge masquee sur REST public. Export dataset necessite wallet allowlist. Pas de faux scores offline.",
        },
      ],
    },
  ],
};
