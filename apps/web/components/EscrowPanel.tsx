"use client";

import type { EscrowOutcome } from "@natt-pundit/contracts";
import {
  canRefundAllVoid,
  canRefundUnmatched,
  deriveEscrowPoolMode,
} from "@natt-pundit/natt-core/escrow_pool_mode";
import { useCallback, useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { ensureNattPunditAppKit, syncNattPunditAppKitMetadata } from "@/lib/nattPunditAppKit";
import { usePresent } from "@/components/present/PresentProvider";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { fetchCpiArgs, fetchMatchScores, fetchSettlementProof } from "@/lib/api";
import { escrowOutcomeFromScore } from "@natt-pundit/natt-core/wcMatchRules";
import {
  MIN_DEPOSIT_USDC,
  claimWinnings,
  createPool,
  depositUsdc,
  EMPTY_POOL_SNAPSHOT,
  escrowUiEnabled,
  explorerTxUrl,
  fetchEscrowActivity,
  fetchWalletUsdcBalance,
  getEscrowProgramId,
  type EscrowActivityView,
  refundAllVoid,
  refundUnmatched,
  settlePool,
  type PoolSnapshot,
  type UserPositionView,
} from "@/lib/nattEscrow";
import { escrowCluster } from "@/lib/escrowCluster";
import { escrowCopy } from "@/lib/escrowI18n";
import { shell } from "@/lib/appShellI18n";
import { formatKickoffCountdown, resolveEscrowPhase, type EscrowPhaseInput } from "@/lib/escrowUx";
import { allowsDrawBetting } from "@/lib/wcMatchRules";
import { consumePhantomSignFailure, consumePhantomSignResult, loadPhantomMobileSession } from "@/lib/phantomMobileDeeplink";
import type { AppLang } from "@/lib/locales";
import { TeamFlag } from "@/components/TeamFlag";
import { teamShortLabel, teamDisplayName } from "@/lib/teamDisplay";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

const POST_TX_POLL_ATTEMPTS = 12;
const POST_TX_POLL_MS = 750;
const CLAIM_FLASH_MS = 10_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Props = {
  fixtureId: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  status: "scheduled" | "live" | "finished";
  wcFormat?: "group" | "knockout";
  score?: { home: number; away: number };
  penScore?: { home: number; away: number };
};

function sideToNum(o: EscrowOutcome): 0 | 1 | 2 {
  if (o === "home") return 0;
  if (o === "draw") return 1;
  return 2;
}

function escrowErrorLabel(msg: string, lang: AppLang, claimCopy?: string): string {
  const s = shell(lang);
  if (msg.includes("devnet_sol_required") || msg.includes("devnet_sol_low")) {
    return s.escrowDevnetSol;
  }
  if (msg.includes("devnet_usdc")) {
    return s.escrowDevnetUsdc;
  }
  if (msg.includes("not_winner") || msg.includes("NotWinner") || msg.includes("6008")) {
    return claimCopy ?? "Not on winning side — no claim.";
  }
  return msg;
}

function mapPhaseToWait(input: EscrowPhaseInput, phase: ReturnType<typeof resolveEscrowPhase>) {
  if (phase === "live_locked" && input.status === "scheduled" && !input.beforeKickoff) {
    return "wait_match" as const;
  }
  return phase;
}

export function EscrowPanel({
  fixtureId,
  kickoffAt,
  homeTeam,
  awayTeam,
  status,
  wcFormat = "group",
  score,
  penScore,
}: Props) {
  const enabled = escrowUiEnabled();
  const programId = getEscrowProgramId();
  const { wallet, hasProjectId } = useSolanaConnectedWallet();
  const { open } = useAppKit();
  const { lang } = usePresent();
  const c = escrowCopy(lang);

  const [pool, setPool] = useState<PoolSnapshot>(EMPTY_POOL_SNAPSHOT);
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [yourPosition, setYourPosition] = useState<UserPositionView | null>(null);
  const [side, setSide] = useState<EscrowOutcome>("home");
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastTx, setLastTx] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [proofValidated, setProofValidated] = useState(false);
  const [resolvedPenScore, setResolvedPenScore] = useState<{ home: number; away: number } | undefined>();
  const [walletUsdc, setWalletUsdc] = useState<number | null>(null);
  const [claimFlash, setClaimFlash] = useState<{ deltaUsdc: number } | null>(null);
  const txStorageKey = `escrow_last_tx_${fixtureId}`;

  const applyActivity = useCallback((act: EscrowActivityView) => {
    setPool(act.pool);
    setParticipantCount(act.participantCount);
    setYourPosition(act.yourPosition);
    setPoolLoaded(true);
  }, []);

  function rememberTx(sig: string) {
    setLastTx(sig);
    if (typeof window !== "undefined" && sig) {
      sessionStorage.setItem(txStorageKey, sig);
    }
  }

  const showDraw = allowsDrawBetting(wcFormat);

  useEffect(() => {
    if (!showDraw && side === "draw") setSide("home");
  }, [showDraw, side]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(txStorageKey);
    if (saved) setLastTx(saved);
  }, [txStorageKey]);

  const refreshActivity = useCallback(async (): Promise<PoolSnapshot | null> => {
    if (!enabled || !programId) return null;
    try {
      const act = await fetchEscrowActivity(fixtureId, wallet?.address ?? null);
      if (act) {
        applyActivity(act);
        return act.pool;
      }
      setPoolLoaded(true);
      return null;
    } catch {
      setPoolLoaded(true);
      return null;
    }
  }, [applyActivity, enabled, fixtureId, programId, wallet?.address]);

  const pollAfterPhantomSign = useCallback(
    async (action: string, walletAddr?: string | null) => {
      const addr =
        walletAddr ?? wallet?.address ?? loadPhantomMobileSession()?.publicKey ?? null;

      for (let i = 0; i < POST_TX_POLL_ATTEMPTS; i++) {
        const act = await fetchEscrowActivity(fixtureId, addr);
        if (act) applyActivity(act);
        const snap = act?.pool;
        const position = act?.yourPosition;

        if (action === "create_pool" && snap?.exists) break;
        if (action === "deposit" && position && position.amountUsdc > 0) break;
        if (action === "settle" && snap?.settled) break;
        if (action === "claim" && position?.claimed) break;
        if (
          (action === "refund_unmatched" || action === "refund_all_void") &&
          (!position?.exists || position.amountUsdc === 0)
        ) {
          break;
        }
        if (snap && action === "deposit" && snap.totalDeposited > BigInt(0) && i >= 3) {
          break;
        }
        await sleep(POST_TX_POLL_MS);
      }

      if (addr) {
        void fetchWalletUsdcBalance(addr).then(setWalletUsdc);
      }
    },
    [applyActivity, fixtureId, wallet?.address],
  );

  const handlePhantomSignComplete = useCallback(
    (detail: { signature: string; fixtureId: string; action?: string }) => {
      if (!detail?.signature) return;
      if (detail.fixtureId !== fixtureId && detail.fixtureId !== "unknown") return;
      setBusy(false);
      setError("");
      rememberTx(detail.signature);
      void pollAfterPhantomSign(detail.action ?? "deposit");
    },
    [fixtureId, pollAfterPhantomSign, txStorageKey],
  );

  useEffect(() => {
    const onPhantomSign = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{ signature: string; fixtureId: string; action?: string }>
      ).detail;
      handlePhantomSignComplete(detail);
    };
    const onPhantomSignFailed = (ev: Event) => {
      const detail = (ev as CustomEvent<{ message?: string }>).detail;
      setBusy(false);
      setError(detail?.message ?? "Transaction Phantom echouee");
    };
    const priorFailure = consumePhantomSignFailure();
    if (priorFailure) {
      setBusy(false);
      setError(priorFailure.message);
    }
    const stashed = consumePhantomSignResult();
    if (
      stashed &&
      (stashed.fixtureId === fixtureId || stashed.fixtureId === "unknown")
    ) {
      handlePhantomSignComplete(stashed);
    }
    window.addEventListener("phantom-sign-complete", onPhantomSign);
    window.addEventListener("phantom-sign-failed", onPhantomSignFailed);
    return () => {
      window.removeEventListener("phantom-sign-complete", onPhantomSign);
      window.removeEventListener("phantom-sign-failed", onPhantomSignFailed);
    };
  }, [fixtureId, handlePhantomSignComplete]);

  useEffect(() => {
    if (!claimFlash) return;
    const id = window.setTimeout(() => setClaimFlash(null), CLAIM_FLASH_MS);
    return () => window.clearTimeout(id);
  }, [claimFlash]);

  useEffect(() => {
    void refreshActivity();
    const id = window.setInterval(() => void refreshActivity(), 30_000);
    return () => window.clearInterval(id);
  }, [refreshActivity]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!wallet?.address) {
      setWalletUsdc(null);
      return;
    }
    void fetchWalletUsdcBalance(wallet.address).then(setWalletUsdc);
  }, [wallet?.address, lastTx, pool.totalDeposited]);

  useEffect(() => {
    if (status !== "finished") {
      setProofValidated(false);
      return;
    }
    const outcome =
      score && status === "finished"
        ? escrowOutcomeFromScore(score, wcFormat, penScore ?? resolvedPenScore) ?? null
        : null;
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchSettlementProof(fixtureId);
        if (!cancelled && p.validated) {
          setProofValidated(true);
          return;
        }
      } catch {
        /* try CPI fallback */
      }
      if (outcome) {
        try {
          await fetchCpiArgs(fixtureId, outcome);
          if (!cancelled) setProofValidated(true);
          return;
        } catch {
          /* both failed */
        }
      }
      if (!cancelled) setProofValidated(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fixtureId, status, score, wcFormat, penScore, resolvedPenScore]);

  const effectivePenScore = penScore ?? resolvedPenScore;

  useEffect(() => {
    if (wcFormat !== "knockout" || status !== "finished" || penScore) {
      setResolvedPenScore(undefined);
      return;
    }
    if (!score || score.home !== score.away) return;
    let cancelled = false;
    void fetchMatchScores(fixtureId)
      .then((snap) => {
        if (!cancelled && snap.penScore) setResolvedPenScore(snap.penScore);
      })
      .catch(() => {
        /* gateway fallback optional */
      });
    return () => {
      cancelled = true;
    };
  }, [fixtureId, penScore, score, status, wcFormat]);

  if (!enabled) return null;

  const kickoffMs = Date.parse(kickoffAt);
  const beforeKickoff = Number.isFinite(kickoffMs) && nowMs < kickoffMs;
  const canCreatePool =
    Boolean(wallet && programId && poolLoaded && !pool.exists && beforeKickoff && status !== "finished");
  const inferredOutcome =
    score && status === "finished"
      ? escrowOutcomeFromScore(score, wcFormat, effectivePenScore) ?? null
      : null;
  const nowSec = Math.floor(nowMs / 1000);
  const poolModeLive = deriveEscrowPoolMode(pool.sideTotals);
  const positionAmountBase = yourPosition?.exists
    ? BigInt(Math.round(yourPosition.amountUsdc * 1_000_000))
    : BigInt(0);
  const canRefundUnmatchedBtn = Boolean(
    wallet &&
      programId &&
      yourPosition?.exists &&
      canRefundUnmatched({
        sideTotals: pool.sideTotals,
        kickoffTs: pool.kickoffTs,
        nowSec,
        poolSettled: pool.settled,
        positionAmount: positionAmountBase,
        positionClaimed: Boolean(yourPosition?.claimed),
      }),
  );
  const canRefundAllBtn = Boolean(
    wallet &&
      programId &&
      yourPosition?.exists &&
      canRefundAllVoid({
        sideTotals: pool.sideTotals,
        poolSettled: pool.settled,
        winningSide: pool.winningSide,
        positionAmount: positionAmountBase,
        positionClaimed: Boolean(yourPosition?.claimed),
      }),
  );
  const canDeposit = Boolean(wallet && programId && pool?.exists && beforeKickoff && !pool?.settled);
  const canSettle =
    Boolean(
      wallet &&
        programId &&
        pool?.exists &&
        !pool?.settled &&
        poolModeLive === "parimutuel" &&
        status === "finished" &&
        proofValidated &&
        inferredOutcome,
    );
  const settleBlockedReason = !wallet
    ? c.connectHint
    : !proofValidated
      ? c.needProof
      : !inferredOutcome
        ? (c.needKnockoutWinner ??
          "Penalty shootout score required (knockout tie) — refresh in a moment.")
        : undefined;
  const canClaim = Boolean(
    wallet &&
      programId &&
      pool?.settled &&
      pool.winningSide < 3 &&
      poolModeLive === "parimutuel" &&
      yourPosition?.exists &&
      positionAmountBase > BigInt(0) &&
      !yourPosition?.claimed &&
      yourPosition?.side &&
      sideToNum(yourPosition.side) === pool.winningSide,
  );
  const userOnWinningSide = Boolean(
    yourPosition?.side &&
      pool.settled &&
      pool.winningSide < 3 &&
      sideToNum(yourPosition.side) === pool.winningSide,
  );
  const claimBlockedReason =
    pool.settled && yourPosition?.exists && !yourPosition.claimed && !userOnWinningSide
      ? (c.claimNotWinner ?? "Only winners can claim after settlement.")
      : undefined;

  const phaseInput: EscrowPhaseInput = {
    hasWallet: Boolean(wallet),
    poolExists: pool.exists,
    poolSettled: pool.settled,
    beforeKickoff,
    status,
    proofValidated,
  };
  const phase = mapPhaseToWait(phaseInput, resolveEscrowPhase(phaseInput));
  const phaseCopy = c.phases[phase];
  const countdown = formatKickoffCountdown(kickoffMs, nowMs, c);

  const stepDone = {
    s1: Boolean(wallet),
    s2: pool.exists,
    s3: Boolean(yourPosition?.exists && yourPosition.amountUsdc > 0),
    s4: pool.settled,
  };

  function usdcFmt(base: bigint): string {
    return (Number(base) / 1_000_000).toFixed(2);
  }

  const poolHasLiquidity = pool.exists && pool.totalDeposited > BigInt(0);
  const poolDrained =
    pool.exists &&
    pool.totalDeposited === BigInt(0) &&
    pool.sideTotals.some((t) => t > BigInt(0));
  const sideRows: { key: EscrowOutcome; total: bigint; label: string }[] = [
    { key: "home", total: pool.sideTotals[0], label: teamShortLabel(homeTeam, lang) },
    ...(showDraw ? [{ key: "draw" as const, total: pool.sideTotals[1], label: c.sideDraw }] : []),
    { key: "away", total: pool.sideTotals[2], label: teamShortLabel(awayTeam, lang) },
  ];
  const maxSide = Math.max(...sideRows.map((r) => Number(r.total)), 1);

  function outcomeLabel(o: EscrowOutcome): string {
    if (o === "home") return teamShortLabel(homeTeam, lang);
    if (o === "away") return teamShortLabel(awayTeam, lang);
    return c.sideDraw;
  }

  function onConnect() {
    setError("");
    if (!hasProjectId) {
      setError(c.connectHint);
      return;
    }
    ensureNattPunditAppKit();
    syncNattPunditAppKitMetadata();
    open({ view: "Connect", namespace: "solana" });
  }

  function isPhantomRedirect(err: unknown): boolean {
    return err instanceof Error && err.message === "phantom_mobile_redirect";
  }

  async function onCreatePool() {
    if (!wallet) return;
    setError("");
    setBusy(true);
    let phantomRedirect = false;
    try {
      const sig = await createPool(wallet, fixtureId, kickoffAt);
      rememberTx(sig);
      for (let i = 0; i < 8; i++) {
        const snap = await refreshActivity();
        if (snap?.exists) break;
        await new Promise((r) => setTimeout(r, 750));
      }
    } catch (e: unknown) {
      if (isPhantomRedirect(e)) {
        phantomRedirect = true;
        return;
      }
      const raw = e instanceof Error ? e.message : "create_pool_failed";
      setError(escrowErrorLabel(raw, lang));
    } finally {
      if (!phantomRedirect) setBusy(false);
    }
  }

  async function onDeposit() {
    if (!wallet) return;
    setError("");
    setBusy(true);
    let phantomRedirect = false;
    try {
      const sig = await depositUsdc(wallet, fixtureId, sideToNum(side), Number(amount));
      rememberTx(sig);
      for (let i = 0; i < 8; i++) {
        const snap = await refreshActivity();
        if (snap && snap.totalDeposited > BigInt(0)) break;
        await new Promise((r) => setTimeout(r, 750));
      }
      void fetchWalletUsdcBalance(wallet.address).then(setWalletUsdc);
    } catch (e: unknown) {
      if (isPhantomRedirect(e)) {
        phantomRedirect = true;
        return;
      }
      const raw = e instanceof Error ? e.message : "deposit_failed";
      setError(escrowErrorLabel(raw, lang));
    } finally {
      if (!phantomRedirect) setBusy(false);
    }
  }

  async function onSettle() {
    if (!wallet) {
      setError(c.connectHint);
      return;
    }
    if (!inferredOutcome) {
      setError(
        c.needKnockoutWinner ??
          "Penalty shootout score required (knockout tie) — refresh in a moment.",
      );
      return;
    }
    setError("");
    setBusy(true);
    try {
      const args = await fetchCpiArgs(fixtureId, inferredOutcome);
      const sig = await settlePool(wallet, fixtureId, args);
      rememberTx(sig);
      for (let i = 0; i < POST_TX_POLL_ATTEMPTS; i++) {
        const snap = await refreshActivity();
        if (snap?.settled) break;
        await sleep(POST_TX_POLL_MS);
      }
    } catch (e: unknown) {
      if (isPhantomRedirect(e)) return;
      setError(e instanceof Error ? e.message : "settle_failed");
    } finally {
      setBusy(false);
    }
  }

  async function onClaim() {
    if (!wallet) {
      setError(c.connectHint);
      return;
    }
    if (!canClaim) {
      setError(claimBlockedReason ?? c.claimNotWinner ?? "Only winners can claim.");
      return;
    }
    setError("");
    setBusy(true);
    const balBefore = walletUsdc;
    try {
      const sig = await claimWinnings(wallet, fixtureId);
      rememberTx(sig);
      let claimed = false;
      for (let i = 0; i < POST_TX_POLL_ATTEMPTS; i++) {
        const act = await fetchEscrowActivity(fixtureId, wallet.address);
        if (act) {
          applyActivity(act);
          if (act.yourPosition?.claimed) {
            claimed = true;
            break;
          }
        }
        await sleep(POST_TX_POLL_MS);
      }
      let deltaUsdc = 0;
      for (let i = 0; i < POST_TX_POLL_ATTEMPTS; i++) {
        const bal = await fetchWalletUsdcBalance(wallet.address);
        setWalletUsdc(bal);
        if (bal !== null && balBefore !== null && bal > balBefore + 0.000_5) {
          deltaUsdc = bal - balBefore;
          break;
        }
        await sleep(POST_TX_POLL_MS);
      }
      if (claimed || deltaUsdc > 0) {
        setClaimFlash({ deltaUsdc: deltaUsdc > 0 ? deltaUsdc : 0 });
      }
      if (!claimed) {
        await refreshActivity();
      }
    } catch (e: unknown) {
      if (isPhantomRedirect(e)) return;
      const raw = e instanceof Error ? e.message : "claim_failed";
      setError(escrowErrorLabel(raw, lang, c.claimNotWinner));
    } finally {
      setBusy(false);
    }
  }

  async function onRefundUnmatched() {
    if (!wallet) return;
    setError("");
    setBusy(true);
    try {
      const sig = await refundUnmatched(wallet, fixtureId);
      rememberTx(sig);
      await refreshActivity();
      void fetchWalletUsdcBalance(wallet.address).then(setWalletUsdc);
    } catch (e: unknown) {
      if (isPhantomRedirect(e)) return;
      setError(e instanceof Error ? e.message : "refund_failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRefundAll() {
    if (!wallet) return;
    setError("");
    setBusy(true);
    try {
      const sig = await refundAllVoid(wallet, fixtureId);
      rememberTx(sig);
      await refreshActivity();
      void fetchWalletUsdcBalance(wallet.address).then(setWalletUsdc);
    } catch (e: unknown) {
      if (isPhantomRedirect(e)) return;
      setError(e instanceof Error ? e.message : "refund_all_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="escrow-panel glass-panel">
      <h3 className="escrow-title">
        {c.title} <span className="escrow-cluster-tag">{escrowCluster()}</span>
      </h3>
      <p className="escrow-disclaimer">{c.disclaimer}</p>

      {!programId ? <p className="escrow-hint">{c.noProgram}</p> : null}

      {programId && poolLoaded ? (
        <div className={`escrow-phase-banner escrow-phase-${phaseCopy.tone}`}>
          <span className="escrow-phase-badge">{phaseCopy.badge}</span>
          <p className="escrow-phase-headline">{phaseCopy.headline}</p>
          <p className="escrow-phase-next">{phaseCopy.next}</p>
          {countdown && beforeKickoff ? (
            <p className="escrow-phase-countdown">{countdown}</p>
          ) : null}
        </div>
      ) : null}

      <details className="escrow-rules">
        <summary>{c.rulesTitle}</summary>
        <ul>
          {c.rulesItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {!showDraw ? <li>{c.ruleKnockout}</li> : null}
        </ul>
      </details>

      <ol className="escrow-steps" aria-label={c.stepsTitle}>
        <li className={stepDone.s1 ? "escrow-step-done" : phase === "connect" ? "escrow-step-active" : ""}>
          1. {c.step1}
        </li>
        <li className={stepDone.s2 ? "escrow-step-done" : phase === "create_pool" ? "escrow-step-active" : ""}>
          2. {c.step2}
        </li>
        <li className={stepDone.s3 ? "escrow-step-done" : phase === "deposit" ? "escrow-step-active" : ""}>
          3. {c.step3}
        </li>
        <li className={stepDone.s4 ? "escrow-step-done" : phase === "settle" || phase === "claim" ? "escrow-step-active" : ""}>
          4. {c.step4}
        </li>
      </ol>

      {yourPosition?.exists && yourPosition.side ? (
        <div className="escrow-your-bet" role="status">
          <h4 className="escrow-board-title">{c.yourBetTitle}</h4>
          <p className="escrow-your-bet-main">
            <span className="escrow-your-bet-amount">{yourPosition.amountUsdc.toFixed(2)} USDC</span>
            <span className="escrow-your-bet-side">→ {outcomeLabel(yourPosition.side)}</span>
          </p>
          {claimFlash ? (
            <span className="escrow-claim-success-pill" role="status">
              <span className="escrow-claim-success-check" aria-hidden>
                ✓
              </span>
              {claimFlash.deltaUsdc > 0 ? (
                <span className="escrow-claim-success-amount">
                  +{claimFlash.deltaUsdc.toFixed(2)} USDC
                </span>
              ) : null}
              <span>{c.claimReceived}</span>
            </span>
          ) : yourPosition.claimed ? (
            <p className="escrow-your-bet-hint">{c.yourBetClaimed}</p>
          ) : pool.settled && poolModeLive === "parimutuel" && !userOnWinningSide ? (
            <p className="escrow-your-bet-hint escrow-your-bet-lost">{c.yourBetLost}</p>
          ) : status === "live" && !pool.settled ? (
            <p className="escrow-your-bet-hint">{c.yourBetLocked}</p>
          ) : poolModeLive === "unmatched" && nowSec >= pool.kickoffTs && !yourPosition.claimed ? (
            <p className="escrow-your-bet-hint">{c.yourBetUnmatchedRefund}</p>
          ) : null}
        </div>
      ) : null}

      {pool.exists ? (
        <div className="escrow-pool-board">
          <h4 className="escrow-board-title">{c.poolBoardTitle}</h4>
          <p className={`escrow-pool-mode escrow-pool-mode-${poolModeLive}`}>
            {poolModeLive === "parimutuel" ? c.poolModeParimutuel : c.poolModeUnmatched}
          </p>
          {poolHasLiquidity ? (
            <>
              <div className="escrow-pool-meta">
                <span>
                  {c.participantsLabel}: <strong>{participantCount}</strong>
                </span>
                <span>
                  {c.poolTotalLabel}: <strong>{usdcFmt(pool.totalDeposited)} USDC</strong>
                </span>
              </div>
              <ul className="escrow-pool-sides" aria-label={c.poolBoardTitle}>
                {sideRows.map((row) => (
                  <li key={row.key} className="escrow-pool-side-row">
                    <span className="escrow-pool-side-label">{row.label}</span>
                    <div className="escrow-pool-side-bar-wrap">
                      <div
                        className="escrow-pool-side-bar"
                        style={{ width: `${Math.max(8, (Number(row.total) / maxSide) * 100)}%` }}
                      />
                    </div>
                    <span className="escrow-pool-side-amt">{usdcFmt(row.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="escrow-pool-empty">{poolDrained ? c.poolVaultEmptyHint : c.poolEmptyHint}</p>
          )}
        </div>
      ) : null}

      {!wallet ? (
        <button
          type="button"
          className="wallet-connect-btn escrow-cta-primary"
          disabled={!hasProjectId}
          onClick={onConnect}
        >
          {c.connect}
        </button>
      ) : (
        <p className="escrow-connected">
          {c.connected}: <span className="escrow-connected-addr">{shortAddr(wallet.address)}</span>
          {walletUsdc !== null ? (
            <span className="escrow-connected-bal"> · {walletUsdc.toFixed(2)} USDC</span>
          ) : null}
        </p>
      )}

      <div className="escrow-sides">
        {(
          [
            { outcome: "home" as const, team: homeTeam },
            ...(showDraw ? [{ outcome: "draw" as const, team: null }] : []),
            { outcome: "away" as const, team: awayTeam },
          ] as const
        ).map(({ outcome, team }) => (
          <button
            key={outcome}
            type="button"
            className={`escrow-side-btn${side === outcome ? " escrow-side-btn-active" : ""}${
              outcome === "draw" ? " escrow-side-btn-draw" : ""
            }`}
            disabled={!canDeposit && !canCreatePool}
            onClick={() => setSide(outcome)}
            aria-label={
              outcome === "draw"
                ? c.sideDraw
                : team
                  ? teamDisplayName(team, lang)
                  : c.sideDraw
            }
          >
            {team ? (
              <>
                <TeamFlag team={team} size="sm" variant="circle" />
                <span className="escrow-side-label">{teamShortLabel(team, lang)}</span>
              </>
            ) : (
              <>
                <span className="escrow-side-draw-mark" aria-hidden>
                  1×1
                </span>
                <span className="escrow-side-label">{c.sideDraw}</span>
              </>
            )}
          </button>
        ))}
      </div>

      <label className="escrow-amount-label">
        USDC
        <input
          className="escrow-amount-input"
          type="number"
          min={MIN_DEPOSIT_USDC}
          step={0.01}
          value={amount}
          disabled={!canDeposit}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <div className="escrow-actions">
        <button
          type="button"
          className={`escrow-action-btn${canCreatePool ? " escrow-action-highlight" : ""}`}
          disabled={!canCreatePool || busy}
          onClick={() => void onCreatePool()}
        >
          {c.createPool}
        </button>
        <button
          type="button"
          className={`escrow-action-btn${canDeposit ? " escrow-action-highlight" : ""}`}
          disabled={!canDeposit || busy}
          onClick={() => void onDeposit()}
        >
          {c.deposit}
        </button>
        <button
          type="button"
          className="escrow-action-btn escrow-action-settle"
          disabled={!canSettle || busy}
          onClick={() => void onSettle()}
          title={!canSettle ? settleBlockedReason : undefined}
        >
          {busy ? (c.settling ?? "Settling…") : c.settle}
          {inferredOutcome ? ` (${outcomeLabel(inferredOutcome)})` : ""}
        </button>
        <button
          type="button"
          className="escrow-action-btn"
          disabled={!canClaim || busy}
          onClick={() => void onClaim()}
          title={!canClaim ? claimBlockedReason : undefined}
        >
          {c.claim}
        </button>
        <button
          type="button"
          className={`escrow-action-btn${canRefundUnmatchedBtn ? " escrow-action-highlight" : ""}`}
          disabled={!canRefundUnmatchedBtn || busy}
          onClick={() => void onRefundUnmatched()}
        >
          {c.refund}
        </button>
        <button
          type="button"
          className="escrow-action-btn"
          disabled={!canRefundAllBtn || busy}
          onClick={() => void onRefundAll()}
        >
          {c.refundAll}
        </button>
      </div>

      <p className="escrow-disabled-hint">{c.whyDisabled}</p>

      {error ? <p className="match-error">{error}</p> : null}
      {lastTx ? (
        <p className="escrow-tx">
          <a className="proof-link" href={explorerTxUrl(lastTx)} target="_blank" rel="noreferrer">
            Explorer tx
          </a>
        </p>
      ) : null}
    </section>
  );
}
