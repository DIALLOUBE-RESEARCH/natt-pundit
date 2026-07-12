import type { EscrowPhase } from "@/lib/escrowUx";
import type { AppLang } from "@/lib/locales";
import { ESCROW_PHASES } from "@/lib/escrowI18nPhases";

export type EscrowPhaseCopy = {
  badge: string;
  headline: string;
  next: string;
  tone: "open" | "wait" | "locked" | "done";
};

export type EscrowCopy = {
  disclaimer: string;
  sideHome: string;
  sideDraw: string;
  sideAway: string;
  title: string;
  connect: string;
  connected: string;
  connectHint: string;
  deposit: string;
  settle: string;
  claim: string;
  noProgram: string;
  createPool: string;
  poolSettled: string;
  needProof: string;
  /** Knockout TAB winner missing — cannot settle yet. */
  needKnockoutWinner?: string;
  /** Shown on settle button while CPI + simulate run. */
  settling?: string;
  walletUsdc: string;
  stepsTitle: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  whyDisabled: string;
  rulesTitle: string;
  rulesItems: string[];
  ruleKnockout: string;
  pillOpen: string;
  pillClosed: string;
  pillSettlement: string;
  cardCta: string;
  poolBoardTitle: string;
  yourBetTitle: string;
  participantsLabel: string;
  poolTotalLabel: string;
  yourBetLocked: string;
  yourBetClaimed: string;
  /** Green pill after successful claim tx. */
  claimReceived: string;
  yourBetUnmatchedRefund: string;
  /** Parimutuel settled — user bet on losing side. */
  yourBetLost?: string;
  claimNotWinner?: string;
  poolEmptyHint: string;
  poolVaultEmptyHint: string;
  poolModeUnmatched: string;
  poolModeParimutuel: string;
  refund: string;
  refundAll: string;
  phases: Record<EscrowPhase, EscrowPhaseCopy>;
  countdownDays: (d: number, h: number) => string;
  countdownHours: (h: number, m: number) => string;
  countdownMinutes: (m: number) => string;
};

type EscrowTop = Omit<
  EscrowCopy,
  "phases" | "countdownDays" | "countdownHours" | "countdownMinutes"
>;

const COUNTDOWN: Record<
  AppLang,
  Pick<EscrowCopy, "countdownDays" | "countdownHours" | "countdownMinutes">
> = {
  en: {
    countdownDays: (d, h) => `Kickoff in ${d}d ${h}h`,
    countdownHours: (h, m) => `Kickoff in ${h}h ${m}m`,
    countdownMinutes: (m) => `Kickoff in ${m} min`,
  },
  fr: {
    countdownDays: (d, h) => `Coup d envoi dans ${d}j ${h}h`,
    countdownHours: (h, m) => `Coup d envoi dans ${h}h ${m}min`,
    countdownMinutes: (m) => `Coup d envoi dans ${m} min`,
  },
  es: {
    countdownDays: (d, h) => `Saque en ${d}d ${h}h`,
    countdownHours: (h, m) => `Saque en ${h}h ${m}m`,
    countdownMinutes: (m) => `Saque en ${m} min`,
  },
  de: {
    countdownDays: (d, h) => `Anstoss in ${d}T ${h}h`,
    countdownHours: (h, m) => `Anstoss in ${h}h ${m}m`,
    countdownMinutes: (m) => `Anstoss in ${m} Min`,
  },
  pt: {
    countdownDays: (d, h) => `Apito em ${d}d ${h}h`,
    countdownHours: (h, m) => `Apito em ${h}h ${m}m`,
    countdownMinutes: (m) => `Apito em ${m} min`,
  },
  ru: {
    countdownDays: (d, h) => `Nachalo cherez ${d}d ${h}ch`,
    countdownHours: (h, m) => `Nachalo cherez ${h}ch ${m}m`,
    countdownMinutes: (m) => `Nachalo cherez ${m} min`,
  },
  ja: {
    countdownDays: (d, h) => `キックオフまで ${d}日 ${h}時間`,
    countdownHours: (h, m) => `キックオフまで ${h}時間 ${m}分`,
    countdownMinutes: (m) => `キックオフまで ${m} 分`,
  },
  zh: {
    countdownDays: (d, h) => `开球 ${d}天 ${h}小时`,
    countdownHours: (h, m) => `开球 ${h}小时 ${m}分`,
    countdownMinutes: (m) => `开球 ${m} 分钟`,
  },
};

const TOP: Record<AppLang, EscrowTop> = {
  en: {
    disclaimer: "Demo escrow on Solana DEVNET — free test USDC only. Not a licensed sportsbook.",
    sideHome: "Home",
    sideDraw: "Draw",
    sideAway: "Away",
    title: "Escrow pool (demo)",
    connect: "Connect wallet",
    connected: "Wallet connected",
    connectHint: "Use the Wallet button in the header (Reown / WalletConnect).",
    deposit: "Deposit USDC",
    settle: "Settle on-chain (TxLINE CPI)",
    claim: "Claim winnings",
    noProgram: "Escrow program not deployed yet.",
    createPool: "Create pool (devnet)",
    poolSettled: "Pool settled.",
    needProof: "TxLINE proof required before settle.",
    needKnockoutWinner: "Penalty shootout score required (knockout tie) — refresh in a moment.",
    settling: "Settling…",
    walletUsdc: "Wallet USDC (devnet)",
    stepsTitle: "Bettor flow",
    step1: "Wallet",
    step2: "Create pool",
    step3: "Deposit 1X2",
    step4: "Settle / Claim",
    whyDisabled: "Grey button = step not available yet (see banner above).",
    rulesTitle: "Demo rules (at a glance)",
    rulesItems: [
      "Bet type: pool betting (mutual pot) — not fixed odds like Bet365 or DraftKings. Winners share the pool pro-rata.",
      "Window: pre-match only — deposits close at kickoff. No in-play / live betting.",
      "Minimum: 0.01 devnet USDC. Circle faucet credits wallet; Deposit USDC funds the pool.",
      "Settlement: official final score proved via TxLINE (TxODDS feed), then Solana on-chain payout.",
      "SETUP / HOLD badge = Natt analytics signal only — separate from your pool bet.",
      "One-sided pool (no counterparty on your pick): full stake refund after kickoff — pool not live yet.",
    ],
    ruleKnockout:
      "Knockout stage (FIFA WC26): no draw — level after 90 min goes to extra time (2×15 min), then penalties if still tied.",
    pillOpen: "Escrow bet",
    pillClosed: "Betting closed",
    pillSettlement: "Settlement",
    cardCta: "Bet 1X2",
    poolBoardTitle: "On-chain pool",
    yourBetTitle: "Your bet",
    participantsLabel: "Participants",
    poolTotalLabel: "Total in pool",
    yourBetLocked: "Stake locked — match in progress. Settle after final whistle.",
    yourBetClaimed: "Winnings claimed.",
    claimReceived: "received on wallet",
    yourBetUnmatchedRefund: "No counterparty — recover your full stake after kickoff (Refund).",
    yourBetLost: "You picked the losing outcome — stake stays in the pool. No payout.",
    claimNotWinner: "Only winners can claim after settlement.",
    poolEmptyHint: "No deposits yet — be the first or wait for agents.",
    poolVaultEmptyHint: "Vault empty — stakes already refunded or claimed.",
    poolModeUnmatched: "Status: waiting for counterparty (pool not live yet)",
    poolModeParimutuel: "Status: shared pool — 2+ countries backed",
    refund: "Recover stake (no opponent)",
    refundAll: "Full refund (void result)",
  },
  fr: {
    disclaimer: "Demo escrow Solana DEVNET — USDC test gratuit. Pas un bookmaker agree.",
    sideHome: "Domicile",
    sideDraw: "Nul",
    sideAway: "Exterieur",
    title: "Pool escrow (demo)",
    connect: "Connecter wallet",
    connected: "Wallet connecte",
    connectHint: "Utilise le bouton Wallet en haut (Reown / WalletConnect).",
    deposit: "Deposer USDC",
    settle: "Regler on-chain (CPI TxLINE)",
    claim: "Claim gains",
    noProgram: "Programme escrow pas encore deploye.",
    createPool: "Creer pool (devnet)",
    poolSettled: "Pool regle.",
    needProof: "Preuve TxLINE requise avant settle.",
    needKnockoutWinner: "Score TAB requis (nul en knockout) — recharge dans un instant.",
    settling: "Reglement…",
    walletUsdc: "USDC wallet (devnet)",
    stepsTitle: "Parcours parieur",
    step1: "Wallet",
    step2: "Creer pool",
    step3: "Deposer 1X2",
    step4: "Settle / Claim",
    whyDisabled: "Bouton grise = etape pas encore disponible (voir bandeau ci-dessus).",
    rulesTitle: "Regles demo (1 coup d oeil)",
    rulesItems: [
      "Type : pool betting (cagnotte mutuelle) — pas de cote fixe type Bet365. Les gagnants se partagent la cagnotte au prorata.",
      "Fenetre : pre-match uniquement — mises fermees au coup d envoi. Pas de live betting.",
      "Minimum : 0.01 USDC devnet. Faucet Circle = wallet ; Deposer USDC = pool.",
      "Settlement : score final officiel prouve TxLINE (feed TxODDS) puis payout Solana.",
      "Badge SETUP/HOLD = signal analytics Natt seulement — independant de ton pari pool.",
      "Pool sans adversaire (un seul camp finance) : recuperation integrale apres coup d envoi — pool pas encore actif.",
    ],
    ruleKnockout:
      "Phase eliminatoire (CDM FIFA 2026) : pas de nul — egalite apres 90 min = prolongations (2×15 min), puis TAB si toujours egal.",
    pillOpen: "Paris escrow",
    pillClosed: "Paris fermes",
    pillSettlement: "Settlement",
    cardCta: "Parier 1X2",
    poolBoardTitle: "Pool on-chain",
    yourBetTitle: "Ta mise",
    participantsLabel: "Participants",
    poolTotalLabel: "Total dans le pool",
    yourBetLocked: "Mise verrouillee — match en cours. Settle apres le coup de sifflet final.",
    yourBetClaimed: "Gains deja reclaim.",
    claimReceived: "recus sur le wallet",
    yourBetUnmatchedRefund: "Pas d adversaire — recuperation integrale apres le coup d envoi (Refund).",
    yourBetLost: "Tu as parie sur le mauvais outcome — mise reste dans la cagnotte. Pas de payout.",
    claimNotWinner: "Seuls les gagnants peuvent claim apres reglement.",
    poolEmptyHint: "Aucun depot pour l instant — sois le premier ou attends les agents.",
    poolVaultEmptyHint: "Vault vide — mises deja remboursees ou reclamees.",
    poolModeUnmatched: "Statut : en attente d adversaire (pool pas encore actif)",
    poolModeParimutuel: "Statut : pool partage — 2+ pays ont des mises",
    refund: "Recuperer ma mise (sans adversaire)",
    refundAll: "Remboursement integral (resultat vide)",
  },
  es: {
    disclaimer: "Demo escrow Solana DEVNET — USDC de prueba gratis. No es casa de apuestas licenciada.",
    sideHome: "Local",
    sideDraw: "Empate",
    sideAway: "Visitante",
    title: "Pool escrow (demo)",
    connect: "Conectar wallet",
    connected: "Wallet conectada",
    connectHint: "Usa el boton Wallet arriba (Reown / WalletConnect).",
    deposit: "Depositar USDC",
    settle: "Liquidar on-chain (CPI TxLINE)",
    claim: "Reclamar ganancias",
    noProgram: "Programa escrow aun no desplegado.",
    createPool: "Crear pool (devnet)",
    poolSettled: "Pool liquidado.",
    needProof: "Prueba TxLINE requerida antes de liquidar.",
    walletUsdc: "USDC wallet (devnet)",
    stepsTitle: "Flujo del apostador",
    step1: "Wallet",
    step2: "Crear pool",
    step3: "Depositar 1X2",
    step4: "Liquidar / Reclamar",
    whyDisabled: "Boton gris = paso no disponible (ver banner arriba).",
    rulesTitle: "Reglas demo (resumen)",
    rulesItems: [
      "Tipo: pool betting (bote mutuo) — sin cuota fija como Bet365. Los ganadores reparten el bote a prorrata.",
      "Ventana: solo pre-match — depositos cierran al saque. Sin apuestas en vivo.",
      "Minimo: 0.01 USDC devnet. Faucet Circle = wallet; Depositar = pool.",
      "Liquidacion: marcador final oficial via TxLINE (feed TxODDS), luego pago on-chain Solana.",
      "Badge SETUP/HOLD = senal analytics Natt — separada de tu apuesta en pool.",
      "Pool sin contrincante (un solo lado financiado): reembolso integral tras el saque — pool aun no activo.",
    ],
    ruleKnockout:
      "Fase eliminatoria (Mundial FIFA 2026): sin empate — igualdad tras 90 min = prorroga (2×15 min), luego penales.",
    pillOpen: "Apuesta escrow",
    pillClosed: "Apuestas cerradas",
    pillSettlement: "Liquidacion",
    cardCta: "Apostar 1X2",
    poolBoardTitle: "Pool on-chain",
    yourBetTitle: "Tu apuesta",
    participantsLabel: "Participantes",
    poolTotalLabel: "Total en pool",
    yourBetLocked: "Apuesta bloqueada — partido en curso.",
    yourBetClaimed: "Ganancias reclamadas.",
    claimReceived: "recibido en wallet",
    yourBetUnmatchedRefund: "Sin contrincante — recupera tu apuesta tras el saque.",
    yourBetLost: "Elegiste el outcome perdedor — la apuesta queda en el bote. Sin pago.",
    claimNotWinner: "Solo los ganadores pueden reclamar tras la liquidacion.",
    poolEmptyHint: "Sin depositos aun.",
    poolVaultEmptyHint: "Vault vacio — apuestas ya reembolsadas.",
    poolModeUnmatched: "Estado: esperando contrincante (pool aun no activo)",
    poolModeParimutuel: "Estado: pool activo — 2+ outcomes financiados",
    refund: "Recuperar apuesta",
    refundAll: "Reembolso total (resultado vacio)",
  },
  de: {
    disclaimer: "Demo-Escrow auf Solana DEVNET — kostenloses Test-USDC. Kein lizenziertes Wettbuero.",
    sideHome: "Heim",
    sideDraw: "Unentschieden",
    sideAway: "Auswaerts",
    title: "Escrow-Pool (Demo)",
    connect: "Wallet verbinden",
    connected: "Wallet verbunden",
    connectHint: "Wallet-Button oben verwenden (Reown / WalletConnect).",
    deposit: "USDC einzahlen",
    settle: "On-chain abrechnen (TxLINE CPI)",
    claim: "Gewinn abholen",
    noProgram: "Escrow-Programm noch nicht deployed.",
    createPool: "Pool erstellen (devnet)",
    poolSettled: "Pool abgerechnet.",
    needProof: "TxLINE-Beweis vor Abrechnung erforderlich.",
    walletUsdc: "Wallet USDC (devnet)",
    stepsTitle: "Wettablauf",
    step1: "Wallet",
    step2: "Pool erstellen",
    step3: "1X2 einzahlen",
    step4: "Abrechnen / Claim",
    whyDisabled: "Grauer Button = Schritt noch nicht verfuegbar (Banner oben).",
    rulesTitle: "Demo-Regeln (kurz)",
    rulesItems: [
      "Typ: Wettpool (gemeinsamer Topf) — keine festen Quoten wie beim Bookmaker. Gewinner teilen den Pool anteilig.",
      "Fenster: nur Pre-Match — Einzahlungen schliessen beim Anstoss. Kein Live-Wetten.",
      "Minimum: 0.01 Devnet-USDC. Circle-Faucet = Wallet; Einzahlung = Pool.",
      "Abrechnung: offizielles Endergebnis via TxLINE (TxODDS-Feed), dann Solana-Auszahlung on-chain.",
      "SETUP/HOLD = Natt-Analytics-Signal — getrennt von deiner Pool-Wette.",
      "Einseitiger Pool (kein Gegner auf deiner Seite): voller Einsatz nach Anstoss zurueck — Pool noch nicht aktiv.",
    ],
    ruleKnockout:
      "K.-o.-Phase (WM 2026): kein Unentschieden — Gleichstand nach 90 Min = Verlaengerung (2×15 Min), dann Elfmeter.",
    pillOpen: "Escrow-Wette",
    pillClosed: "Wetten geschlossen",
    pillSettlement: "Abrechnung",
    cardCta: "1X2 wetten",
    poolBoardTitle: "On-chain Pool",
    yourBetTitle: "Dein Einsatz",
    participantsLabel: "Teilnehmer",
    poolTotalLabel: "Gesamt im Pool",
    yourBetLocked: "Einsatz gesperrt — Spiel lauft.",
    yourBetClaimed: "Gewinn bereits geclaimt.",
    claimReceived: "auf Wallet erhalten",
    yourBetUnmatchedRefund: "Kein Gegner — voller Einsatz nach Anstoss zuruck.",
    yourBetLost: "Falsches Ergebnis gewaehlt — Einsatz bleibt im Pool. Keine Auszahlung.",
    claimNotWinner: "Nur Gewinner koennen nach Abrechnung claimen.",
    poolEmptyHint: "Noch keine Einzahlungen.",
    poolVaultEmptyHint: "Vault leer — Einsaetze bereits zurueckgezahlt.",
    poolModeUnmatched: "Status: wartet auf Gegenseite (Pool noch nicht aktiv)",
    poolModeParimutuel: "Status: Pool aktiv — 2+ Ergebnisse finanziert",
    refund: "Einsatz zuruckholen",
    refundAll: "Voller Refund (leeres Ergebnis)",
  },
  pt: {
    disclaimer: "Demo escrow Solana DEVNET — USDC teste gratis. Nao e casa de apostas licenciada.",
    sideHome: "Casa",
    sideDraw: "Empate",
    sideAway: "Fora",
    title: "Pool escrow (demo)",
    connect: "Conectar wallet",
    connected: "Wallet conectada",
    connectHint: "Use o botao Wallet no topo (Reown / WalletConnect).",
    deposit: "Depositar USDC",
    settle: "Liquidar on-chain (CPI TxLINE)",
    claim: "Resgatar ganhos",
    noProgram: "Programa escrow ainda nao implantado.",
    createPool: "Criar pool (devnet)",
    poolSettled: "Pool liquidado.",
    needProof: "Prova TxLINE necessaria antes de liquidar.",
    walletUsdc: "USDC wallet (devnet)",
    stepsTitle: "Fluxo do apostador",
    step1: "Wallet",
    step2: "Criar pool",
    step3: "Depositar 1X2",
    step4: "Liquidar / Resgatar",
    whyDisabled: "Botao cinza = etapa indisponivel (ver banner acima).",
    rulesTitle: "Regras demo (resumo)",
    rulesItems: [
      "Tipo: pool betting (pote mutuo) — sem odd fixa como Bet365. Vencedores dividem o pote pro-rata.",
      "Janela: apenas pre-match — depositos fecham no apito. Sem apostas ao vivo.",
      "Minimo: 0.01 USDC devnet. Faucet Circle = wallet; Depositar = pool.",
      "Liquidacao: resultado final oficial via TxLINE (feed TxODDS), depois pagamento on-chain Solana.",
      "SETUP/HOLD = sinal analytics Natt — separado da tua aposta no pool.",
      "Pool sem adversario (um lado so financiado): reembolso integral apos o apito — pool ainda nao ativo.",
    ],
    ruleKnockout:
      "Fase eliminatoria (Copa 2026): sem empate — igual apos 90 min = prorrogacao (2×15 min), depois penaltis.",
    pillOpen: "Aposta escrow",
    pillClosed: "Apostas fechadas",
    pillSettlement: "Liquidacao",
    cardCta: "Apostar 1X2",
    poolBoardTitle: "Pool on-chain",
    yourBetTitle: "A tua aposta",
    participantsLabel: "Participantes",
    poolTotalLabel: "Total no pool",
    yourBetLocked: "Aposta bloqueada — jogo a decorrer.",
    yourBetClaimed: "Ganhos ja reclamados.",
    claimReceived: "recebido na wallet",
    yourBetUnmatchedRefund: "Sem adversario — recupera apos o apito.",
    yourBetLost: "Escolheste o outcome perdedor — aposta fica no pool. Sem pagamento.",
    claimNotWinner: "So vencedores podem resgatar apos liquidacao.",
    poolEmptyHint: "Sem depositos ainda.",
    poolVaultEmptyHint: "Vault vazio — apostas ja reembolsadas.",
    poolModeUnmatched: "Estado: aguardando adversario (pool ainda nao ativo)",
    poolModeParimutuel: "Estado: pool ativo — 2+ outcomes financiados",
    refund: "Recuperar aposta",
    refundAll: "Reembolso total",
  },
  ru: {
    disclaimer: "Demo escrow Solana DEVNET — besplatnyy test USDC. Ne litsenzirovannaya bukmekerskaya.",
    sideHome: "Dom",
    sideDraw: "Nichya",
    sideAway: "Gosti",
    title: "Escrow-pul (demo)",
    connect: "Podklyuchit koshelek",
    connected: "Koshelek podklyuchen",
    connectHint: "Knopka Wallet v shapke (Reown / WalletConnect).",
    deposit: "Vnesti USDC",
    settle: "Raschet on-chain (TxLINE CPI)",
    claim: "Zabrat vyigrysh",
    noProgram: "Programma escrow esche ne razvernutа.",
    createPool: "Sozdat pool (devnet)",
    poolSettled: "Pul rasschitan.",
    needProof: "Dokazatelstvo TxLINE nuzhno do rascheta.",
    walletUsdc: "USDC koshelek (devnet)",
    stepsTitle: "Potok stavok",
    step1: "Koshelek",
    step2: "Sozdat pool",
    step3: "Vnesti 1X2",
    step4: "Raschet / Claim",
    whyDisabled: "Seryy button = shag esche nedostupen (sm. banner).",
    rulesTitle: "Pravila demo",
    rulesItems: [
      "Tip: pool betting (obshchiy bank) — ne fiksirovannye koeffitsienty kak u Bet365. Pobediteli delyat bank proportsionalno.",
      "Okno: tolko pre-match — vznosy zakryvayutsya pri nachale matcha. Bez live-stavok.",
      "Minimum: 0.01 USDC devnet. Circle faucet = koshelek; depozit = pool.",
      "Raschet: ofitsialnyj finalnyy schet cherez TxLINE (feed TxODDS), zatem vyplata on-chain Solana.",
      "SETUP/HOLD = signal analytics Natt — otdelno ot stavki v pule.",
      "Odnostoronniy pool (net protivnika na vashem iskhode): polnyj vozvrat posle nachala — pool esche ne aktiven.",
    ],
    ruleKnockout:
      "Play-off (CHM 2026): nichya nevozmozhna — posle 90 min dop. vremya (2×15 min), zatem penalti.",
    pillOpen: "Stavka escrow",
    pillClosed: "Stavki zakryty",
    pillSettlement: "Raschet",
    cardCta: "Stavit 1X2",
    poolBoardTitle: "On-chain pool",
    yourBetTitle: "Vasha stavka",
    participantsLabel: "Uchastniki",
    poolTotalLabel: "Vsego v pule",
    yourBetLocked: "Stavka zablokirovana — match idet.",
    yourBetClaimed: "Vyigrysh poluchen.",
    claimReceived: "polucheno na koshelek",
    yourBetUnmatchedRefund: "Net protivnika — polnyj vozvrat posle nachala.",
    yourBetLost: "Vybrali proigravshiy iskhod — stavka ostayetsya v pule. Bez vyplaty.",
    claimNotWinner: "Claim posle rascheta tolko u pobediteley.",
    poolEmptyHint: "Depozitov poka net.",
    poolVaultEmptyHint: "Vault pust — stavki uzhe vozvrashheny.",
    poolModeUnmatched: "Status: ozhidanie protivnika (pool esche ne aktiven)",
    poolModeParimutuel: "Status: pool aktiven — 2+ iskhoda profinansirovany",
    refund: "Vernut stavku",
    refundAll: "Polnyj vozvrat",
  },
  ja: {
    disclaimer: "Solana DEVNET デモエスクロー — テスト USDC のみ。ライセンス取得のブックメーカーではありません。",
    sideHome: "ホーム",
    sideDraw: "ドロー",
    sideAway: "アウェイ",
    title: "エスクロープール（デモ）",
    connect: "ウォレット接続",
    connected: "ウォレット接続済",
    connectHint: "ヘッダーの Wallet ボタン（Reown / WalletConnect）を使用。",
    deposit: "USDC 入金",
    settle: "on-chain 決済（TxLINE CPI）",
    claim: "賞金請求",
    noProgram: "エスクロープログラム未デプロイ。",
    createPool: "プール作成（devnet）",
    poolSettled: "プール決済済。",
    needProof: "決済前に TxLINE 証明が必要。",
    walletUsdc: "ウォレット USDC（devnet）",
    stepsTitle: "ベットフロー",
    step1: "ウォレット",
    step2: "プール作成",
    step3: "1X2 入金",
    step4: "決済 / Claim",
    whyDisabled: "グレーボタン = まだ利用不可（上のバナー参照）。",
    rulesTitle: "デモルール",
    rulesItems: [
      "タイプ：プールベッティング（相互プール）— Bet365 のような固定オッズではありません。勝者がプールを按分分配。",
      "ウィンドウ：プレマッチのみ — キックオフで入金締切。インプレイ / ライブベットなし。",
      "最低：0.01 devnet USDC。Circle ファウセット = ウォレット；入金 = プール。",
      "決済：TxLINE が公式最終スコアを証明（TxODDS フィード）、その後 Solana オンチェーン払い出し。",
      "SETUP/HOLD = Natt 分析シグナルのみ — プールベットとは別。",
      "片側プール（相手なし）：キックオフ後に全額返金 — プールはまだ未稼働。",
    ],
    ruleKnockout:
      "ノックアウト（W杯 2026）：ドローなし — 90分同点は延長（2×15分）、その後 PK。",
    pillOpen: "エスクローベット",
    pillClosed: "ベット終了",
    pillSettlement: "決済",
    cardCta: "1X2 ベット",
    poolBoardTitle: "オンチェーンプール",
    yourBetTitle: "あなたのベット",
    participantsLabel: "参加者",
    poolTotalLabel: "プール合計",
    yourBetLocked: "ベットロック中 — 試合進行中。",
    yourBetClaimed: "配当受取済み。",
    claimReceived: "ウォレットに反映",
    yourBetUnmatchedRefund: "対戦相手なし — キックオフ後に全額返金。",
    yourBetLost: "負けた outcome を選択 — 賭け金はプールに残ります。払い出しなし。",
    claimNotWinner: "決済後に請求できるのは勝者のみ。",
    poolEmptyHint: "まだデポジットがありません。",
    poolVaultEmptyHint: "ボールトは空です — 既に返金または請求済み。",
    poolModeUnmatched: "状態：対戦相手待ち（プール未稼働）",
    poolModeParimutuel: "状態：プール稼働中 — 2+ outcome に資金",
    refund: "賭け金を回収",
    refundAll: "全額返金",
  },
  zh: {
    disclaimer: "Solana DEVNET 演示托管 — 仅测试 USDC。非持牌博彩。",
    sideHome: "主",
    sideDraw: "平",
    sideAway: "客",
    title: "托管池（演示）",
    connect: "连接钱包",
    connected: "钱包已连接",
    connectHint: "使用顶部 Wallet 按钮（Reown / WalletConnect）。",
    deposit: "存入 USDC",
    settle: "链上结算 (TxLINE CPI)",
    claim: "领取奖金",
    noProgram: "托管程序尚未部署。",
    createPool: "创建池 (devnet)",
    poolSettled: "池已结算。",
    needProof: "结算前需要 TxLINE 证明。",
    walletUsdc: "钱包 USDC (devnet)",
    stepsTitle: "投注流程",
    step1: "钱包",
    step2: "创建池",
    step3: "存入 1X2",
    step4: "结算 / 领取",
    whyDisabled: "灰色按钮 = 步骤暂不可用（见上方横幅）。",
    rulesTitle: "演示规则",
    rulesItems: [
      "类型：彩池投注（互助池）— 非 Bet365 式固定赔率。赢家按比例分配彩池。",
      "窗口：仅赛前 — 开球截止存款。无滚球 / 现场投注。",
      "最低：0.01 devnet USDC。Circle 水龙头 = 钱包；存款 = 彩池。",
      "结算：TxLINE 证明官方最终比分（TxODDS 数据源），然后 Solana 链上支付。",
      "SETUP/HOLD = Natt 分析信号 — 与彩池投注分开。",
      "单边彩池（无对手方）：开球后全额退款 — 彩池尚未激活。",
    ],
    ruleKnockout: "淘汰赛（2026 世界杯）：无平局 — 90 分钟平局进加时（2×15 分），仍平则点球。",
    pillOpen: "托管投注",
    pillClosed: "投注已关闭",
    pillSettlement: "结算",
    cardCta: "投注 1X2",
    poolBoardTitle: "链上池",
    yourBetTitle: "你的投注",
    participantsLabel: "参与者",
    poolTotalLabel: "池内总额",
    yourBetLocked: "投注已锁定 — 比赛进行中。",
    yourBetClaimed: "已领取奖金。",
    claimReceived: "已到账钱包",
    yourBetUnmatchedRefund: "无对手 — 开球后可全额取回。",
    yourBetLost: "选了失败 outcome — 投注留在彩池中。无支付。",
    claimNotWinner: "结算后仅赢家可领取。",
    poolEmptyHint: "尚无存款。",
    poolVaultEmptyHint: "金库为空 — 投注已退款或已领取。",
    poolModeUnmatched: "状态：等待对手（彩池未激活）",
    poolModeParimutuel: "状态：彩池已激活 — 2+ outcome 有资金",
    refund: "取回投注",
    refundAll: "全额退款",
  },
};

function build(lang: AppLang): EscrowCopy {
  return { ...TOP[lang], ...COUNTDOWN[lang], phases: ESCROW_PHASES[lang] };
}

const ESCROW_BASE: Record<AppLang, EscrowCopy> = {
  en: build("en"),
  fr: build("fr"),
  es: build("es"),
  de: build("de"),
  pt: build("pt"),
  ru: build("ru"),
  ja: build("ja"),
  zh: build("zh"),
};

export function escrowCopy(lang: AppLang): EscrowCopy {
  return ESCROW_BASE[lang] ?? ESCROW_BASE.en;
}

export function escrowSideLabel(lang: AppLang, side: "home" | "draw" | "away"): string {
  const c = escrowCopy(lang);
  if (side === "home") return c.sideHome;
  if (side === "draw") return c.sideDraw;
  return c.sideAway;
}
