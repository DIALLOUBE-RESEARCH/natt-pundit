import type { EscrowPhase } from "@/lib/escrowUx";
import type { AppLang } from "@/lib/locales";
import type { EscrowPhaseCopy } from "@/lib/escrowI18n";

type PhaseMap = Record<EscrowPhase, EscrowPhaseCopy>;

const EN: PhaseMap = {
  connect: {
    badge: "Pre-match betting",
    headline: "Bet on this match via a Solana escrow pool (devnet demo).",
    next: "Step 1 — connect your Solana wallet (header or button below).",
    tone: "open",
  },
  create_pool: {
    badge: "Pre-match open",
    headline: "No pool yet — first bettor opens the pool betting market.",
    next: "Step 2 — Create pool, pick winner side, then Deposit USDC.",
    tone: "open",
  },
  deposit: {
    badge: "Pre-match open",
    headline: "Pool active — bets accepted until kickoff (standard rule).",
    next: "Step 3 — pick outcome, min 0.01 devnet USDC, then Deposit USDC.",
    tone: "open",
  },
  wait_match: {
    badge: "Betting closed",
    headline: "Kickoff passed — no more deposits (pre-match only).",
    next: "Wait for full time. On-chain settlement after TxLINE final-score proof.",
    tone: "locked",
  },
  live_locked: {
    badge: "Live — betting closed",
    headline: "No in-play betting: escrow locks at kickoff.",
    next: "TxODDS / TxLINE feeds live score and final proof.",
    tone: "locked",
  },
  wait_proof: {
    badge: "Match finished",
    headline: "Waiting for TxLINE Merkle proof (official score).",
    next: "Once validated, Settle on-chain pays the winning side.",
    tone: "wait",
  },
  settle: {
    badge: "Ready to settle",
    headline: "Proof OK — on-chain pool settlement available.",
    next: "Step 4 — Settle on-chain (TxLINE CPI) then Claim if you won.",
    tone: "wait",
  },
  claim: {
    badge: "Pool settled",
    headline: "Winners claim their share of the pool.",
    next: "Claim winnings if your outcome won.",
    tone: "done",
  },
  done: {
    badge: "Closed",
    headline: "No betting on this fixture anymore.",
    next: "Pick another pre-kickoff match to open or join a pool.",
    tone: "done",
  },
};

const FR: PhaseMap = {
  connect: {
    badge: "Paris pre-match",
    headline: "Parie sur ce match via un pool escrow Solana (demo devnet).",
    next: "Etape 1 — connecte ton wallet Solana (bouton en haut ou ci-dessous).",
    tone: "open",
  },
  create_pool: {
    badge: "Paris pre-match ouverts",
    headline: "Aucun pool — le premier parieur ouvre le marche pool betting.",
    next: "Etape 2 — Creer pool, choisis le vainqueur, Deposer USDC.",
    tone: "open",
  },
  deposit: {
    badge: "Paris pre-match ouverts",
    headline: "Pool actif — mises jusqu au coup d envoi (regle standard).",
    next: "Etape 3 — outcome, min 0.01 USDC devnet, puis Deposer USDC.",
    tone: "open",
  },
  wait_match: {
    badge: "Paris fermes",
    headline: "Coup d envoi passe — plus de depot (pre-match uniquement).",
    next: "Attends la fin. Settlement on-chain apres preuve TxLINE.",
    tone: "locked",
  },
  live_locked: {
    badge: "Match en cours — paris fermes",
    headline: "Pas de pari live : escrow verrouille au coup d envoi.",
    next: "TxODDS/TxLINE = score live + preuve finale.",
    tone: "locked",
  },
  wait_proof: {
    badge: "Match termine",
    headline: "En attente preuve Merkle TxLINE (score officiel ancre).",
    next: "Preuve OK → Regler on-chain distribue le pool au bon outcome.",
    tone: "wait",
  },
  settle: {
    badge: "Settlement pret",
    headline: "Preuve OK — reglement pool on-chain disponible.",
    next: "Etape 4 — Regler on-chain puis Claim si tu as gagne.",
    tone: "wait",
  },
  claim: {
    badge: "Pool regle",
    headline: "Les gagnants recuperent leur part du pool.",
    next: "Claim gains si ton outcome a gagne.",
    tone: "done",
  },
  done: {
    badge: "Termine",
    headline: "Plus de paris sur ce match.",
    next: "Choisis un autre match avant coup d envoi.",
    tone: "done",
  },
};

const ES: PhaseMap = {
  connect: {
    badge: "Apuesta pre-partido",
    headline: "Apuesta en este partido via pool escrow Solana (demo devnet).",
    next: "Paso 1 — conecta tu wallet Solana (arriba o abajo).",
    tone: "open",
  },
  create_pool: {
    badge: "Apuestas abiertas",
    headline: "Sin pool — el primero abre el mercado de pool betting.",
    next: "Paso 2 — Crear pool, elegir ganador, Depositar USDC.",
    tone: "open",
  },
  deposit: {
    badge: "Apuestas abiertas",
    headline: "Pool activo — apuestas hasta el saque inicial.",
    next: "Paso 3 — outcome, min 0.01 USDC devnet, Depositar USDC.",
    tone: "open",
  },
  wait_match: {
    badge: "Apuestas cerradas",
    headline: "Saque iniciado — no hay mas depositos.",
    next: "Espera el final. Liquidacion on-chain tras prueba TxLINE.",
    tone: "locked",
  },
  live_locked: {
    badge: "En vivo — apuestas cerradas",
    headline: "Sin apuestas en vivo: escrow bloqueado al saque.",
    next: "TxODDS/TxLINE alimentan marcador y prueba final.",
    tone: "locked",
  },
  wait_proof: {
    badge: "Partido terminado",
    headline: "Esperando prueba Merkle TxLINE (marcador oficial).",
    next: "Prueba OK → Liquidar on-chain paga al ganador.",
    tone: "wait",
  },
  settle: {
    badge: "Listo para liquidar",
    headline: "Prueba OK — liquidacion del pool on-chain disponible.",
    next: "Paso 4 — Liquidar on-chain y Reclamar si ganaste.",
    tone: "wait",
  },
  claim: {
    badge: "Pool liquidado",
    headline: "Los ganadores reclaman su parte del pool.",
    next: "Reclamar ganancias si tu outcome gano.",
    tone: "done",
  },
  done: {
    badge: "Cerrado",
    headline: "No hay mas apuestas en este partido.",
    next: "Elige otro partido antes del saque.",
    tone: "done",
  },
};

const DE: PhaseMap = {
  connect: {
    badge: "Pre-Match-Wetten",
    headline: "Wette auf dieses Spiel via Solana-Escrow (Devnet-Demo).",
    next: "Schritt 1 — Solana-Wallet verbinden.",
    tone: "open",
  },
  create_pool: {
    badge: "Pre-Match offen",
    headline: "Noch kein Pool — Erster oeffnet den Wettpool-Markt.",
    next: "Schritt 2 — Pool erstellen, Sieger waehlen, USDC einzahlen.",
    tone: "open",
  },
  deposit: {
    badge: "Pre-Match offen",
    headline: "Pool aktiv — Wetten bis Anstoss.",
    next: "Schritt 3 — Outcome, min 0.01 Devnet-USDC, einzahlen.",
    tone: "open",
  },
  wait_match: {
    badge: "Wetten geschlossen",
    headline: "Anstoss vorbei — keine Einzahlungen mehr.",
    next: "Warte auf Ende. On-chain-Settlement nach TxLINE-Beweis.",
    tone: "locked",
  },
  live_locked: {
    badge: "Live — Wetten geschlossen",
    headline: "Kein Live-Wetten: Escrow sperrt bei Anstoss.",
    next: "TxODDS/TxLINE liefern Live-Score und Endbeweis.",
    tone: "locked",
  },
  wait_proof: {
    badge: "Spiel beendet",
    headline: "Warte auf TxLINE-Merkle-Beweis (offizielles Ergebnis).",
    next: "Beweis OK → On-chain-Abrechnung zahlt Gewinner.",
    tone: "wait",
  },
  settle: {
    badge: "Bereit zur Abrechnung",
    headline: "Beweis OK — On-chain-Pool-Abrechnung verfuegbar.",
    next: "Schritt 4 — Abrechnen, dann Gewinn abholen.",
    tone: "wait",
  },
  claim: {
    badge: "Pool abgerechnet",
    headline: "Gewinner holen ihren Anteil ab.",
    next: "Gewinn abholen wenn dein Outcome gewann.",
    tone: "done",
  },
  done: {
    badge: "Geschlossen",
    headline: "Keine Wetten mehr auf dieses Spiel.",
    next: "Anderes Spiel vor Anstoss waehlen.",
    tone: "done",
  },
};

const PT: PhaseMap = {
  connect: {
    badge: "Aposta pre-jogo",
    headline: "Aposte neste jogo via pool escrow Solana (demo devnet).",
    next: "Passo 1 — conecte sua wallet Solana.",
    tone: "open",
  },
  create_pool: {
    badge: "Apostas abertas",
    headline: "Sem pool — o primeiro abre o mercado de pool betting.",
    next: "Passo 2 — Criar pool, escolher vencedor, Depositar USDC.",
    tone: "open",
  },
  deposit: {
    badge: "Apostas abertas",
    headline: "Pool ativo — apostas ate o apito inicial.",
    next: "Passo 3 — outcome, min 0.01 USDC devnet, Depositar USDC.",
    tone: "open",
  },
  wait_match: {
    badge: "Apostas fechadas",
    headline: "Apito inicial — sem mais depositos.",
    next: "Aguarde o fim. Settlement on-chain apos prova TxLINE.",
    tone: "locked",
  },
  live_locked: {
    badge: "Ao vivo — apostas fechadas",
    headline: "Sem live betting: escrow trava no apito.",
    next: "TxODDS/TxLINE alimentam placar e prova final.",
    tone: "locked",
  },
  wait_proof: {
    badge: "Jogo encerrado",
    headline: "Aguardando prova Merkle TxLINE (placar oficial).",
    next: "Prova OK → Liquidar on-chain paga o vencedor.",
    tone: "wait",
  },
  settle: {
    badge: "Pronto para liquidar",
    headline: "Prova OK — liquidacao do pool on-chain disponivel.",
    next: "Passo 4 — Liquidar on-chain e Resgatar se ganhou.",
    tone: "wait",
  },
  claim: {
    badge: "Pool liquidado",
    headline: "Vencedores resgatam sua parte do pool.",
    next: "Resgatar ganhos se seu outcome venceu.",
    tone: "done",
  },
  done: {
    badge: "Encerrado",
    headline: "Sem mais apostas neste jogo.",
    next: "Escolha outro jogo antes do apito.",
    tone: "done",
  },
};

const RU: PhaseMap = {
  connect: {
    badge: "Stavki do matcha",
    headline: "Stavka na etot match cherez escrow-pul Solana (demo devnet).",
    next: "Shag 1 — podklyuchite koshelek Solana.",
    tone: "open",
  },
  create_pool: {
    badge: "Stavki otkryty",
    headline: "Pula net — pervyy otkryvaet rynok pool betting.",
    next: "Shag 2 — Sozdat pul, vybrat pobeditelya, Vnesti USDC.",
    tone: "open",
  },
  deposit: {
    badge: "Stavki otkryty",
    headline: "Pul aktiven — stavki do nachala matcha.",
    next: "Shag 3 — outcome, min 0.01 USDC devnet, Vnesti USDC.",
    tone: "open",
  },
  wait_match: {
    badge: "Stavki zakryty",
    headline: "Match nachalsya — depozity zakryty.",
    next: "Do konca matcha. On-chain raschet posle dokazatelstva TxLINE.",
    tone: "locked",
  },
  live_locked: {
    badge: "Live — stavki zakryty",
    headline: "Net live-stavok: escrow blokiruetsya pri nachale.",
    next: "TxODDS/TxLINE — schet i finalnyy dokazatelstvo.",
    tone: "locked",
  },
  wait_proof: {
    badge: "Match zavershen",
    headline: "Ozhidanie Merkle-dokazatelstva TxLINE.",
    next: "Dokazatelstvo OK → on-chain vyplata pobeditelyu.",
    tone: "wait",
  },
  settle: {
    badge: "Gotov k raschetu",
    headline: "Dokazatelstvo OK — on-chain raschet pula dostupen.",
    next: "Shag 4 — Raschet on-chain, zatem Claim.",
    tone: "wait",
  },
  claim: {
    badge: "Pul rasschitan",
    headline: "Pobediteli zabirayut svoyu dolyu.",
    next: "Claim esli vash outcome vyigral.",
    tone: "done",
  },
  done: {
    badge: "Zakryto",
    headline: "Stavki na etot match bolsche ne prinimayutsya.",
    next: "Vyberite drugoy match do nachala.",
    tone: "done",
  },
};

const JA: PhaseMap = {
  connect: {
    badge: "試合前ベット",
    headline: "Solana エスクロープールでこの試合にベット（devnet デモ）。",
    next: "ステップ 1 — Solana ウォレットを接続。",
    tone: "open",
  },
  create_pool: {
    badge: "試合前オープン",
    headline: "プール未作成 — 最初のベッターがマーケットを開く。",
    next: "ステップ 2 — プール作成、勝者を選択、USDC 入金。",
    tone: "open",
  },
  deposit: {
    badge: "試合前オープン",
    headline: "プール稼働中 — キックオフまでベット可能。",
    next: "ステップ 3 — outcome、最低 0.01 devnet USDC、入金。",
    tone: "open",
  },
  wait_match: {
    badge: "ベット終了",
    headline: "キックオフ済み — これ以上入金不可。",
    next: "試合終了を待つ。TxLINE 証明後に on-chain 決済。",
    tone: "locked",
  },
  live_locked: {
    badge: "ライブ — ベット終了",
    headline: "インプレイベットなし：キックオフでロック。",
    next: "TxODDS/TxLINE がスコアと最終証明を提供。",
    tone: "locked",
  },
  wait_proof: {
    badge: "試合終了",
    headline: "TxLINE Merkle 証明待ち（公式スコア）。",
    next: "証明 OK → on-chain 決済で勝者に分配。",
    tone: "wait",
  },
  settle: {
    badge: "決済準備完了",
    headline: "証明 OK — オンチェーンプール決済が可能。",
    next: "ステップ 4 — on-chain 決済、勝利なら Claim。",
    tone: "wait",
  },
  claim: {
    badge: "プール決済済",
    headline: "勝者がプールの分配を請求。",
    next: "outcome が勝利なら Claim。",
    tone: "done",
  },
  done: {
    badge: "終了",
    headline: "この試合へのベットは終了。",
    next: "キックオフ前の別試合を選択。",
    tone: "done",
  },
};

const ZH: PhaseMap = {
  connect: {
    badge: "赛前投注",
    headline: "通过 Solana 托管池投注本场比赛（devnet 演示）。",
    next: "步骤 1 — 连接 Solana 钱包。",
    tone: "open",
  },
  create_pool: {
    badge: "赛前开放",
    headline: "尚无池 — 首位投注者开启彩池市场。",
    next: "步骤 2 — 创建池、选择胜者、存入 USDC。",
    tone: "open",
  },
  deposit: {
    badge: "赛前开放",
    headline: "池已激活 — 开球前可投注。",
    next: "步骤 3 — 选择 outcome，最低 0.01 devnet USDC，存入。",
    tone: "open",
  },
  wait_match: {
    badge: "投注已关闭",
    headline: "已开球 — 不可再存入。",
    next: "等待比赛结束。TxLINE 证明后进行链上结算。",
    tone: "locked",
  },
  live_locked: {
    badge: "进行中 — 投注关闭",
    headline: "无滚球投注：开球时锁定。",
    next: "TxODDS/TxLINE 提供比分与最终证明。",
    tone: "locked",
  },
  wait_proof: {
    badge: "比赛结束",
    headline: "等待 TxLINE Merkle 证明（官方比分）。",
    next: "证明 OK → 链上结算支付给胜方。",
    tone: "wait",
  },
  settle: {
    badge: "可结算",
    headline: "证明 OK — 链上彩池结算可用。",
    next: "步骤 4 — 链上结算，胜则领取。",
    tone: "wait",
  },
  claim: {
    badge: "池已结算",
    headline: "胜者领取池份额。",
    next: "若 outcome 获胜则 Claim。",
    tone: "done",
  },
  done: {
    badge: "已关闭",
    headline: "本场不可再投注。",
    next: "选择开球前的其他比赛。",
    tone: "done",
  },
};

export const ESCROW_PHASES: Record<AppLang, PhaseMap> = {
  en: EN,
  fr: FR,
  es: ES,
  de: DE,
  pt: PT,
  ru: RU,
  ja: JA,
  zh: ZH,
};
