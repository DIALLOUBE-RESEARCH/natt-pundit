"use client";

import type { EscrowOutcome } from "@natt-pundit/contracts";
import { mapFanBetStatus } from "@natt-pundit/natt-core/fan_bet_status";
import { useCallback, useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { TeamFlag } from "@/components/TeamFlag";
import { usePresent } from "@/components/present/PresentProvider";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { FanBetOnboarding } from "@/features/betting/FanBetOnboarding";
import { ensureNattPunditAppKit, syncNattPunditAppKitMetadata } from "@/lib/nattPunditAppKit";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { collectFanPayout, placeFanBet } from "@/lib/fanBetOrchestrator";
import { fanBetCopy } from "@/lib/fanBetI18n";
import { escrowKeeperEnabled } from "@/lib/fanUiFlag";
import {
  EMPTY_POOL_SNAPSHOT,
  MIN_DEPOSIT_USDC,
  escrowUiEnabled,
  explorerTxUrl,
  fetchEscrowActivity,
  fetchWalletUsdcBalance,
  getEscrowProgramId,
  type EscrowActivityView,
  type PoolSnapshot,
  type UserPositionView,
} from "@/lib/nattEscrow";
import { escrowCluster } from "@/lib/escrowCluster";
import { escrowBettableBeforeKickoff } from "@/lib/escrowUx";
import { allowsDrawBetting } from "@/lib/wcMatchRules";
import {
  consumePhantomSignFailure,
  consumePhantomSignResult,
} from "@/lib/phantomMobileDeeplink";
import type { AppLang } from "@/lib/locales";
import { teamShortLabel } from "@/lib/teamDisplay";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function sideToNum(o: EscrowOutcome): 0 | 1 | 2 {
  if (o === "home") return 0;
  if (o === "draw") return 1;
  return 2;
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

export function FanBetSlip({
  fixtureId,
  kickoffAt,
  homeTeam,
  awayTeam,
  status,
  wcFormat = "group",
  score: _score,
  penScore: _penScore,
}: Props) {
  const enabled = escrowUiEnabled();
  const programId = getEscrowProgramId();
  const { wallet, hasProjectId } = useSolanaConnectedWallet();
  const { open } = useAppKit();
  const { lang } = usePresent();
  const c = fanBetCopy(lang);

  const [pool, setPool] = useState<PoolSnapshot>(EMPTY_POOL_SNAPSHOT);
  const [participantCount, setParticipantCount] = useState(0);
  const [yourPosition, setYourPosition] = useState<UserPositionView | null>(null);
  const [side, setSide] = useState<EscrowOutcome>("home");
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [lastTx, setLastTx] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [walletUsdc, setWalletUsdc] = useState<number | null>(null);
  const [claimFlash, setClaimFlash] = useState<{ deltaUsdc: number } | null>(null);

  const showDraw = allowsDrawBetting(wcFormat);
  const beforeKickoff = escrowBettableBeforeKickoff(kickoffAt, status, nowMs);
  const nowSec = Math.floor(nowMs / 1000);
  const positionAmountBase = yourPosition?.exists
    ? BigInt(Math.round(yourPosition.amountUsdc * 1_000_000))
    : BigInt(0);
  const userOnWinningSide = Boolean(
    yourPosition?.side &&
      pool.settled &&
      pool.winningSide < 3 &&
      sideToNum(yourPosition.side) === pool.winningSide,
  );

  const applyActivity = useCallback((act: EscrowActivityView) => {
    setPool(act.pool);
    setParticipantCount(act.participantCount);
    setYourPosition(act.yourPosition);
  }, []);

  const refreshActivity = useCallback(async () => {
    if (!enabled || !programId) return;
    try {
      const act = await fetchEscrowActivity(fixtureId, wallet?.address ?? null);
      if (act) applyActivity(act);
    } catch {
      /* keep last snapshot */
    }
  }, [applyActivity, enabled, fixtureId, programId, wallet?.address]);

  useEffect(() => {
    void refreshActivity();
    const id = window.setInterval(() => void refreshActivity(), 30_000);
    return () => window.clearInterval(id);
  }, [refreshActivity]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!showDraw && side === "draw") setSide("home");
  }, [showDraw, side]);

  useEffect(() => {
    if (!wallet?.address) {
      setWalletUsdc(null);
      return;
    }
    void fetchWalletUsdcBalance(wallet.address).then(setWalletUsdc);
  }, [wallet?.address, lastTx, pool.totalDeposited]);

  useEffect(() => {
    const onPhantomSign = () => {
      setBusy(false);
      setPlacing(false);
      void refreshActivity();
    };
    const priorFailure = consumePhantomSignFailure();
    if (priorFailure) {
      setBusy(false);
      setPlacing(false);
      setError(priorFailure.message);
    }
    if (consumePhantomSignResult()) onPhantomSign();
    window.addEventListener("phantom-sign-complete", onPhantomSign);
    return () => window.removeEventListener("phantom-sign-complete", onPhantomSign);
  }, [refreshActivity]);

  if (!enabled) return null;

  const fanStatus = mapFanBetStatus({
    hasWallet: Boolean(wallet),
    placing,
    poolExists: pool.exists,
    poolSettled: pool.settled,
    winningSide: pool.winningSide,
    sideTotals: pool.sideTotals,
    kickoffTs: pool.kickoffTs,
    nowSec,
    fixtureStatus: status,
    beforeKickoff,
    positionExists: Boolean(yourPosition?.exists),
    positionAmountBase,
    positionClaimed: Boolean(yourPosition?.claimed),
    userOnWinningSide,
    keeperEnabled: escrowKeeperEnabled,
  });

  const canPlace =
    Boolean(wallet && programId && beforeKickoff && status !== "finished" && !placing) &&
    (fanStatus === "ready_to_bet" || (fanStatus === "ticket_open" && positionAmountBase === BigInt(0)));

  const canCollect = fanStatus === "collect_available" && !escrowKeeperEnabled;
  const canRefund = fanStatus === "refund_available";

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

  async function onPlaceBet() {
    if (!wallet) return;
    setError("");
    setBusy(true);
    setPlacing(true);
    try {
      const sig = await placeFanBet(wallet, fixtureId, kickoffAt, side, Number(amount));
      setLastTx(sig);
      for (let i = 0; i < 8; i++) {
        const act = await fetchEscrowActivity(fixtureId, wallet.address);
        if (act) {
          applyActivity(act);
          if (act.yourPosition && act.yourPosition.amountUsdc > 0) break;
        }
        await new Promise((r) => setTimeout(r, 750));
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "phantom_mobile_redirect") return;
      setError(e instanceof Error ? e.message : "place_bet_failed");
    } finally {
      setBusy(false);
      setPlacing(false);
    }
  }

  async function onCollect() {
    if (!wallet) return;
    setError("");
    setBusy(true);
    const balBefore = walletUsdc;
    try {
      const sig = await collectFanPayout(wallet, fixtureId, kickoffAt);
      setLastTx(sig);
      await refreshActivity();
      if (balBefore !== null) {
        const bal = await fetchWalletUsdcBalance(wallet.address);
        if (bal !== null && bal > balBefore + 0.000_5) {
          setClaimFlash({ deltaUsdc: bal - balBefore });
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "collect_failed");
    } finally {
      setBusy(false);
    }
  }

  function outcomeLabel(o: EscrowOutcome, langCode: AppLang): string {
    if (o === "home") return teamShortLabel(homeTeam, langCode);
    if (o === "away") return teamShortLabel(awayTeam, langCode);
    return c.sideDraw;
  }

  const usdcFmt = (base: bigint) => (Number(base) / 1_000_000).toFixed(2);

  return (
    <section className="stitch-fan-bet-slip">
      <div className="stitch-fan-bet-slip-head">
        <p className="stitch-fan-bet-disclaimer">{c.disclaimer}</p>
        <LiquidGlassPill as="div" variant="agent" className="stitch-fan-bet-cluster">
          <span>{escrowCluster()}</span>
        </LiquidGlassPill>
      </div>

      <FanBetOnboarding />

      {!programId ? <p className="stitch-fan-bet-hint">{c.noProgram}</p> : null}

      <div className="stitch-fan-bet-status" role="status">
        <span className="stitch-fan-bet-status-label">{c.statusLabel}</span>
        <p className="stitch-fan-bet-status-text">{c.status[fanStatus]}</p>
      </div>

      {yourPosition?.exists && yourPosition.side ? (
        <div className="stitch-fan-bet-ticket" role="status">
          <p className="stitch-fan-bet-ticket-title">{c.ticketTitle}</p>
          <p className="stitch-fan-bet-ticket-main">
            <span className="stitch-fan-bet-ticket-amount">{yourPosition.amountUsdc.toFixed(2)} USDC</span>
            <span className="stitch-fan-bet-ticket-side">→ {outcomeLabel(yourPosition.side, lang)}</span>
          </p>
          {claimFlash ? (
            <span className="stitch-fan-bet-claim-pill" role="status">
              +{claimFlash.deltaUsdc.toFixed(2)} USDC {c.claimReceived}
            </span>
          ) : null}
        </div>
      ) : null}

      {pool.exists && pool.totalDeposited > BigInt(0) ? (
        <div className="stitch-fan-bet-pool">
          <p className="stitch-fan-bet-pool-title">{c.poolTitle}</p>
          <p className="stitch-fan-bet-pool-meta">
            <span>
              {c.participants}: <strong>{participantCount}</strong>
            </span>
            <span>
              {c.poolTotal}: <strong>{usdcFmt(pool.totalDeposited)} USDC</strong>
            </span>
          </p>
        </div>
      ) : null}

      {!wallet ? (
        <LiquidGlassPill variant="agent" className="stitch-fan-bet-connect" onClick={onConnect}>
          {c.connect}
        </LiquidGlassPill>
      ) : (
        <p className="stitch-fan-bet-wallet">
          {c.connected}: {shortAddr(wallet.address)}
          {walletUsdc !== null ? ` · ${walletUsdc.toFixed(2)} USDC` : null}
        </p>
      )}

      {canPlace ? (
        <div className="stitch-fan-bet-form">
          <div className="stitch-fan-bet-outcomes">
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
                className={`stitch-fan-bet-outcome${side === outcome ? " stitch-fan-bet-outcome--active" : ""}`}
                onClick={() => setSide(outcome)}
              >
                {team ? (
                  <>
                    <span className="stitch-flag-circle stitch-flag-circle--bet">
                      <TeamFlag team={team} size="sm" variant="circle" />
                    </span>
                    <span className="stitch-fan-bet-outcome-label">{teamShortLabel(team, lang)}</span>
                  </>
                ) : (
                  <span className="stitch-fan-bet-outcome-label">{c.sideDraw}</span>
                )}
              </button>
            ))}
          </div>
          <label className="stitch-fan-bet-stake">
            <span className="stitch-fan-bet-stake-label">{c.stakeLabel}</span>
            <input
              className="stitch-fan-bet-stake-input"
              type="number"
              min={MIN_DEPOSIT_USDC}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <LiquidGlassPill
            variant="bet"
            className="stitch-fan-bet-cta"
            disabled={busy}
            onClick={() => void onPlaceBet()}
          >
            <span>{placing || busy ? c.placing : c.placeBet}</span>
            <span aria-hidden>→</span>
          </LiquidGlassPill>
        </div>
      ) : null}

      {canCollect ? (
        <LiquidGlassPill
          variant="bet"
          className="stitch-fan-bet-cta"
          disabled={busy}
          onClick={() => void onCollect()}
        >
          <span>{busy ? c.collecting : c.collect}</span>
        </LiquidGlassPill>
      ) : null}

      {canRefund ? (
        <LiquidGlassPill
          variant="bet"
          className="stitch-fan-bet-cta"
          disabled={busy}
          onClick={() => void onCollect()}
        >
          <span>{busy ? c.collecting : c.refund}</span>
        </LiquidGlassPill>
      ) : null}

      {error ? <p className="stitch-fan-bet-error">{error}</p> : null}
      {lastTx ? (
        <p className="stitch-fan-bet-tx">
          <a href={explorerTxUrl(lastTx)} target="_blank" rel="noopener noreferrer">
            Explorer tx
          </a>
        </p>
      ) : null}
    </section>
  );
}
