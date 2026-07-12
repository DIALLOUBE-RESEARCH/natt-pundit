import type { AppLang } from "@/lib/locales";
import { deUi, esUi, jaUi, ptUi, ruUi, zhUi } from "./uiCopyLocales";

export type UiCopy = {
  navFixtures: string;
  navTxline: string;
  dataUnavailable: string;
  syncTxline: string;
  backFixtures: string;
  matchDetailsLabel: string;
  oddsWaiting: string;
  liveOdds: string;
  edgeUnavailable: string;
  proofLoading: string;
  proofPending: string;
  proofPendingPrematch: string;
  proofUnavailable: string;
  settlementTitle: string;
  sourceTxline: string;
  sourceMock: string;
  statValidYes: string;
  statValidWait: string;
  statValidFailed: string;
  statScoreMismatch: (proofStat: string, scoreLine: string) => string;
  statValidMock: string;
  explorer: string;
  explorerLink: string;
  merkleRoot: string;
  leaf: string;
  proofPath: string;
  stat: string;
  validOnchain: string;
  decompTitle: string;
  decompLead: string;
  convictionMax: (name: string) => string;
  strongestSignal: (name: string) => string;
  maxSignalTag: string;
  colOutcome: string;
  colDiagnostic: string;
  convictionGap: (pct: string, above: boolean) => string;
  homeEventKicker: string;
  homeProductKicker: string;
  homeKicker: string;
  homeTitle: string;
  homeFixturesTitle: string;
  homeLead: string;
  homeSource: (s: string) => string;
  draw: string;
  oddsDrawShort: string;
  odds1x2Tag: string;
  oddsWinnerTag: string;
  oddsMarketHintGroup: string;
  oddsMarketHintKnockout: string;
  oddsFavoriteTag: string;
  matchVs: string;
  verdictSetup: string;
  verdictHold: string;
  statusLive: string;
  statusUpcoming: string;
  statusFinished: string;
  badgeFinished: string;
  pillBet: string;
  viewAllMatches: string;
  homeNoFixtures: string;
  tabHome: string;
  tabMatches: string;
  tabDataLab: string;
  tabDocs: string;
  tabWallet: string;
  navDatas: string;
  datasKicker: string;
  datasTitle: string;
  datasLead: string;
  datasClvTitle: string;
  datasClvLead: string;
  clvVerified: string;
  clvNotYet: string;
  datasClvN: string;
  datasClvMean: string;
  datasClvCi: string;
  datasClvBeats: string;
  datasClvProgress: (n: number, nMin: number) => string;
  datasClvIndicative: string;
  datasStreamsTitle: string;
  datasStreamsLead: string;
  datasSignalsTitle: string;
  datasSignalsLead: string;
  datasProofsTitle: string;
  datasProofsLead: string;
  colStream: string;
  colRecords: string;
  colSize: string;
  colFirst: string;
  colLast: string;
  colMatch: string;
  colEdge: string;
  colVerdict: string;
  colSeq: string;
  colRoot: string;
  colStatus: string;
  colProgram: string;
  datasEmpty: string;
  datasUpdated: (s: string) => string;
  datasNoProofs: string;
  datasExport: string;
  datasExportHint: string;
  datasExportConnect: string;
  datasExportBusy: string;
  datasExportDenied: string;
};

const en: UiCopy = {
  navFixtures: "Fixtures",
  navTxline: "TxLINE",
  dataUnavailable: "Data unavailable",
  syncTxline: "Syncing TxLINE...",
  backFixtures: "<- Fixtures",
  matchDetailsLabel: "Match Details",
  oddsWaiting: "Odds pending publication...",
  liveOdds: "LIVE ODDS",
  edgeUnavailable: "Edge unavailable",
  proofLoading: "Loading Merkle proof...",
  proofPending: "Proof pending - first scored event not anchored yet",
  proofPendingPrematch: "Match not finished — final TxLINE proof available after FT",
  proofUnavailable: "Settlement proof unavailable",
  settlementTitle: "Settlement (TxLINE / Solana)",
  sourceTxline: "TxLINE (live)",
  sourceMock: "mock (dev)",
  statValidYes: "Merkle verified (local)",
  statValidWait: "awaiting verification",
  statValidFailed: "Merkle verification failed (local)",
  statScoreMismatch: (proofStat, scoreLine) =>
    `TxLINE stats (${proofStat}) do not match displayed score (${scoreLine})`,
  statValidMock: "awaiting (mock)",
  explorer: "Solana Explorer",
  explorerLink: "Open on Solana Explorer",
  merkleRoot: "Merkle root",
  leaf: "Leaf",
  proofPath: "Proof path",
  stat: "Stat",
  validOnchain: "Local Merkle check",
  decompTitle: "Outcome decomposition",
  decompLead:
    "Shin pi_tx, model pi_model, combined c - per 1X2 outcome. Not a prediction: a consensus gap diagnostic.",
  convictionMax: (name: string) => `Conviction (max signal: ${name})`,
  strongestSignal: (name: string) => `Strongest signal: ${name}`,
  maxSignalTag: "max signal",
  colOutcome: "Outcome",
  colDiagnostic: "Diagnostic",
  convictionGap: (pct: string, above: boolean) =>
    above ? `Measurable gap: +${pct} pp - above epsilon` : `Gap ${pct} pp - no setup`,
  homeEventKicker: "FIFA World Cup 2026",
  homeProductKicker: "Analytics PWA",
  homeKicker: "TxODDS · Prediction Markets & Settlement",
  homeTitle: "Natt Settlement",
  homeFixturesTitle: "Today's Fixtures",
  homeLead:
    "Shin consensus, two-source logit combine, SETUP/HOLD edge. Merkle settlement viewer.",
  homeSource: (s: string) => `Source: ${s}`,
  draw: "Draw",
  oddsDrawShort: "Draw",
  odds1x2Tag: "1X2",
  oddsWinnerTag: "Winner",
  oddsMarketHintGroup: "TxLINE 90-min market — lower = more likely",
  oddsMarketHintKnockout: "Knockout winner — level after 90 min → extra time, then pens",
  oddsFavoriteTag: "Fav",
  matchVs: "VS",
  verdictSetup: "Setup",
  verdictHold: "Hold",
  statusLive: "Live",
  statusUpcoming: "Upcoming",
  statusFinished: "FT",
  badgeFinished: "Finished",
  pillBet: "BET 1X2",
  viewAllMatches: "View all matches →",
  homeNoFixtures: "No live or upcoming fixtures.",
  tabHome: "Home",
  tabMatches: "Matches",
  tabDataLab: "DataLab",
  tabDocs: "Docs",
  tabWallet: "Wallet",
  navDatas: "Data Lab",
  datasKicker: "R&D · Benter-style edge lab",
  datasTitle: "Data Lab",
  datasLead:
    "Every odds tick, score, edge and Merkle anchor we capture — logged append-only, timestamped, exportable. The proof our SETUP signals are real, not decoration.",
  datasClvTitle: "Closing Line Value verdict",
  datasClvLead:
    "The only honest edge test: did the closing line move toward our pick? Verified only after 500+ samples with a strictly positive bootstrap lower bound. Until then: not proven.",
  clvVerified: "CLV VERIFIED",
  clvNotYet: "NOT PROVEN YET",
  datasClvN: "Samples",
  datasClvMean: "Mean CLV",
  datasClvCi: "95% CI (bootstrap)",
  datasClvBeats: "% beating the close",
  datasClvProgress: (n: number, nMin: number) => `${n} / ${nMin} samples to certification`,
  datasClvIndicative:
    "Indicative only — too few clean samples for a meaningful mean. This is noise, not a verdict, until the sample grows.",
  datasStreamsTitle: "Live dataset",
  datasStreamsLead:
    "Append-only JSONL streams, deduplicated on change. Survives restarts (disk-backed).",
  datasSignalsTitle: "Live edge signals",
  datasSignalsLead:
    "Model (Elo Poisson / Dixon-Coles, live-adjusted) vs market (Shin de-vig). A SETUP fires only on genuine disagreement above the net-edge threshold.",
  datasProofsTitle: "Recent Merkle anchors",
  datasProofsLead: "Settlement roots logged from TxLINE, anchored on Solana.",
  colStream: "Stream",
  colRecords: "Records",
  colSize: "Size",
  colFirst: "First",
  colLast: "Last",
  colMatch: "Match",
  colEdge: "Edge",
  colVerdict: "Verdict",
  colSeq: "Seq",
  colRoot: "Merkle root",
  colStatus: "Status",
  colProgram: "Program",
  datasEmpty: "No data yet — the logger is warming up.",
  datasUpdated: (s: string) => `Updated ${s}`,
  datasNoProofs: "No Merkle anchors logged yet.",
  datasExport: "Download dataset (ZIP)",
  datasExportHint: "JSONL streams + DATACARD + manifest. Sign-In With Solana (allowlisted wallets).",
  datasExportConnect: "Connect wallet to download",
  datasExportBusy: "Signing…",
  datasExportDenied: "Export denied — wallet not allowlisted or signature invalid.",
};

const fr: UiCopy = {
  ...en,
  navFixtures: "Matchs",
  dataUnavailable: "Donnees indisponibles",
  syncTxline: "Sync TxLINE...",
  backFixtures: "<- Matchs",
  matchDetailsLabel: "Details du match",
  oddsWaiting: "Cotes en attente de publication...",
  liveOdds: "COTES LIVE",
  edgeUnavailable: "Edge indisponible",
  proofLoading: "Chargement preuve Merkle...",
  proofPending: "Preuve en attente - premier evenement score pas encore ancre",
  proofPendingPrematch: "Match pas termine — preuve TxLINE finale disponible apres le coup de sifflet",
  proofUnavailable: "Preuve settlement indisponible",
  settlementTitle: "Settlement (TxLINE / Solana)",
  statValidYes: "Merkle verifie (local)",
  statValidWait: "en attente verification",
  statValidFailed: "verification Merkle echouee (local)",
  statScoreMismatch: (proofStat, scoreLine) =>
    `Stats TxLINE (${proofStat}) != score affiche (${scoreLine})`,
  statValidMock: "en attente (mock)",
  validOnchain: "Verification Merkle locale",
  explorer: "Explorer Solana",
  explorerLink: "Voir sur Solana Explorer",
  decompTitle: "Decomposition par outcome",
  decompLead:
    "Shin pi_tx, modele pi_model, combine c - diagnostic d ecart vs consensus, pas une prediction.",
  convictionMax: (name: string) => `Conviction (signal max : ${name})`,
  strongestSignal: (name: string) => `Signal le plus fort : ${name}`,
  maxSignalTag: "signal max",
  colOutcome: "Outcome",
  colDiagnostic: "Diagnostic",
  convictionGap: (pct: string, above: boolean) =>
    above ? `Ecart mesurable : +${pct} pts - au-dessus epsilon` : `Ecart ${pct} pts - pas de setup`,
  homeEventKicker: "Coupe du Monde FIFA 2026",
  homeKicker: "TxODDS · Marches predictifs & settlement",
  homeFixturesTitle: "Matchs du jour",
  homeLead:
    "Consensus Shin, combine logit deux sources, edge SETUP/HOLD. Viewer settlement Merkle.",
  homeSource: (s: string) => `Source : ${s}`,
  draw: "Match nul",
  oddsDrawShort: "Nul",
  odds1x2Tag: "1X2",
  oddsWinnerTag: "Vainqueur",
  oddsMarketHintGroup: "Cotes marche TxLINE (90 min) — plus bas = plus favori",
  oddsMarketHintKnockout:
    "Eliminatoire : vainqueur du match — egalite = prolongations puis TAB",
  oddsFavoriteTag: "Favori",
  verdictSetup: "Setup",
  verdictHold: "Attente",
  statusLive: "Live",
  statusUpcoming: "A venir",
  statusFinished: "FT",
  badgeFinished: "Termine",
  pillBet: "PARIER 1X2",
  viewAllMatches: "Voir tous les matchs →",
  homeNoFixtures: "Aucun match live ou a venir.",
  tabHome: "Accueil",
  tabMatches: "Matchs",
  tabDataLab: "DataLab",
  tabDocs: "Docs",
  tabWallet: "Wallet",
  navDatas: "Data Lab",
  datasKicker: "R&D · labo edge facon Benter",
  datasTitle: "Data Lab",
  datasLead:
    "Chaque tick de cote, score, edge et ancre Merkle capture - logue en append-only, horodate, exportable. La preuve que nos signaux SETUP sont reels, pas decoratifs.",
  datasClvTitle: "Verdict Closing Line Value",
  datasClvLead:
    "Le seul test honnete d'edge : la ligne de cloture a-t-elle bouge vers notre pick ? Certifie seulement apres 500+ echantillons avec borne basse bootstrap strictement positive. Avant ca : non prouve.",
  clvVerified: "CLV PROUVE",
  clvNotYet: "PAS ENCORE PROUVE",
  datasClvN: "Echantillons",
  datasClvMean: "CLV moyen",
  datasClvCi: "IC 95% (bootstrap)",
  datasClvBeats: "% battant la cloture",
  datasClvProgress: (n: number, nMin: number) => `${n} / ${nMin} echantillons avant certification`,
  datasClvIndicative:
    "Indicatif seulement - trop peu d'echantillons propres pour une moyenne fiable. C'est du bruit, pas un verdict, tant que l'echantillon ne grossit pas.",
  datasStreamsTitle: "Dataset live",
  datasStreamsLead:
    "Flux JSONL append-only, dedupliques au changement. Resistent au redemarrage (sur disque).",
  datasSignalsTitle: "Signaux edge live",
  datasSignalsLead:
    "Modele (Elo Poisson / Dixon-Coles, ajuste live) vs marche (Shin de-vig). Un SETUP ne s'allume que sur desaccord reel au-dessus du seuil d'edge net.",
  datasProofsTitle: "Ancres Merkle recentes",
  datasProofsLead: "Racines de settlement loguees depuis TxLINE, ancrees sur Solana.",
  colStream: "Flux",
  colRecords: "Enregistrements",
  colSize: "Taille",
  colFirst: "Premier",
  colLast: "Dernier",
  colMatch: "Match",
  colEdge: "Edge",
  colVerdict: "Verdict",
  colSeq: "Seq",
  colRoot: "Racine Merkle",
  colStatus: "Statut",
  colProgram: "Programme",
  datasEmpty: "Pas encore de data - le logger chauffe.",
  datasUpdated: (s: string) => `Maj ${s}`,
  datasNoProofs: "Aucune ancre Merkle loguee pour l'instant.",
  datasExport: "Telecharger le dataset (ZIP)",
  datasExportHint: "Flux JSONL + DATACARD + manifest. Sign-In With Solana (wallets autorises).",
  datasExportConnect: "Connecter le wallet pour telecharger",
  datasExportBusy: "Signature…",
  datasExportDenied: "Export refuse — wallet non autorise ou signature invalide.",
};

export const UI_COPY: Record<AppLang, UiCopy> = {
  en,
  fr,
  es: esUi,
  de: deUi,
  pt: ptUi,
  ru: ruUi,
  ja: jaUi,
  zh: zhUi,
};

export function ui(lang: AppLang): UiCopy {
  return UI_COPY[lang] ?? UI_COPY.en;
}
