"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { usePresent } from "@/components/present/PresentProvider";
import { useWalletPortfolio } from "@/hooks/useWalletPortfolio";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { openNattPunditWalletModal } from "@/features/wallet/nattPunditAppKit";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";
import { agentDashCopy } from "@/lib/agentDashI18n";
import { WalletBetEscrowAction } from "@/components/stitch/panels/WalletBetEscrowAction";
import { teamLabel } from "@/lib/teamI18n";
import { betPickCountryLabel, betStatusLabel, walletCopy } from "@/lib/walletI18n";
import { formatSolBalance } from "@/lib/formatSolBalance";
import type { BetLedgerStatus } from "@/lib/walletPortfolio";
import { walletBetDisplayAmount } from "@/lib/walletPortfolio";

const ACTIVITY_COLLAPSED_COUNT = 2;

function fmtUsdc(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtSol(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return formatSolBalance(n);
}

function fmtPnl(n: number | null, pendingLabel: string, estLabel: string, estimated: boolean): string {
  if (n === null) return pendingLabel;
  const prefix = n >= 0 ? "+" : "";
  const core = `${prefix}${fmtUsdc(n)}`;
  return estimated ? `${core} ${estLabel}` : core;
}

function statusTone(status: BetLedgerStatus): string {
  if (status === "won" || status === "claimable" || status === "refunded") return "win";
  if (status === "lost") return "loss";
  if (status === "open" || status === "refund_eligible") return "open";
  return "neutral";
}

/** Positive = green, negative = red, zero/null = neutral. */
function walletNumTone(n: number | null | undefined): "up" | "down" | "neutral" {
  if (n === null || n === undefined || Number.isNaN(n)) return "neutral";
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "neutral";
}

function walletNumClass(base: string, n: number | null | undefined): string {
  return `${base} stitch-wallet-num--${walletNumTone(n)}`;
}

function WalletConnectHero({ onConnect }: { onConnect: () => void }) {
  const { lang } = usePresent();
  const c = walletCopy(lang);

  return (
    <div className="stitch-wallet-connect-card">
      <div className="stitch-wallet-connect-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v3"
          />
        </svg>
      </div>
      <h2 className="stitch-wallet-connect-title">{c.connectTitle}</h2>
      <p className="stitch-wallet-connect-body">{c.connectBody}</p>
      <button type="button" className="stitch-wallet-primary-btn" onClick={onConnect}>
        {c.connectCta}
      </button>
    </div>
  );
}

export function StitchWalletPanel() {
  const { lang } = usePresent();
  const c = walletCopy(lang);
  const agent = agentDashCopy(lang);
  const { open } = useAppKit();
  const { address, isConnected } = useSolanaConnectedWallet();
  const { balances, bets, summary, loading, error, updatedAt, cluster, refresh } = useWalletPortfolio(
    isConnected ? address : null,
  );
  const [activityExpanded, setActivityExpanded] = useState(false);

  const visibleBets = useMemo(() => {
    if (activityExpanded || bets.length <= ACTIVITY_COLLAPSED_COUNT) return bets;
    return bets.slice(0, ACTIVITY_COLLAPSED_COUNT);
  }, [activityExpanded, bets]);

  const hiddenBetCount = Math.max(0, bets.length - ACTIVITY_COLLAPSED_COUNT);

  const clusterLabel = cluster === "devnet" ? c.clusterDevnet : c.clusterMainnet;
  const updatedLabel = updatedAt
    ? c.updatedAt(
        updatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      )
    : null;

  const totalDisplayUsdc = useMemo(() => {
    if (balances.usdc === null) return null;
    return balances.usdc;
  }, [balances.usdc]);

  const openConnect = () => {
    openNattPunditWalletModal(open, isConnected);
  };

  return (
    <div className="stitch-panel stitch-panel--wallet">
      <section className="stitch-wallet-hero">
        <p className="stitch-wallet-kicker">{c.kicker}</p>
        <div className="stitch-wallet-hero-row">
          <div>
            <h1 className="stitch-wallet-title">{c.title}</h1>
            <p className="stitch-wallet-lead">{c.lead}</p>
          </div>
          <span className="stitch-wallet-cluster-badge">{clusterLabel}</span>
        </div>
      </section>

      <section className="stitch-agent-entry-card" aria-labelledby="stitch-agent-entry-title">
        <Link href="/agent" className="stitch-agent-entry-link">
          <div>
            <p id="stitch-agent-entry-title" className="stitch-agent-entry-kicker">
              MCP
            </p>
            <p className="stitch-agent-entry-cta">{agent.walletEntryCta} →</p>
            <p className="stitch-agent-entry-lead">{agent.walletEntryLead}</p>
          </div>
          <span className="stitch-agent-entry-badge" aria-hidden>
            ◆
          </span>
        </Link>
      </section>

      {!isConnected || !address ? (
        <WalletConnectHero onConnect={openConnect} />
      ) : (
        <>
          <div className="stitch-wallet-balance-card">
            <p className="stitch-wallet-balance-label">{c.totalBalance}</p>
            <p className="stitch-wallet-balance-main">
              {totalDisplayUsdc !== null ? (
                <>
                  <span className={walletNumClass("stitch-wallet-balance-amount", totalDisplayUsdc)}>
                    {fmtUsdc(totalDisplayUsdc)}
                  </span>
                  <span className="stitch-wallet-balance-unit">USDC</span>
                </>
              ) : (
                <span className="stitch-wallet-balance-amount">—</span>
              )}
            </p>
            <div className="stitch-wallet-token-row">
              <div className="stitch-wallet-token-chip">
                <span className="stitch-wallet-token-name">{c.solBalance}</span>
                <span
                  className={walletNumClass(
                    "stitch-wallet-token-value",
                    balances.sol !== null ? balances.sol : null,
                  )}
                >
                  {balances.sol !== null ? `${fmtSol(balances.sol)} SOL` : c.solUnavailable}
                </span>
              </div>
              <div className="stitch-wallet-token-chip stitch-wallet-token-chip--accent">
                <span className="stitch-wallet-token-name">{c.usdcBalance}</span>
                <span
                  className={walletNumClass(
                    "stitch-wallet-token-value",
                    balances.usdc !== null ? balances.usdc : null,
                  )}
                >
                  {balances.usdc !== null ? `${fmtUsdc(balances.usdc)} USDC` : c.usdcUnavailable}
                </span>
              </div>
            </div>
          </div>

          <div className="stitch-wallet-stats-grid">
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryOpen}</span>
              <span className={walletNumClass("stitch-wallet-stat-value", summary.openCount)}>
                {summary.openCount}
              </span>
            </div>
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryStaked}</span>
              <span className={walletNumClass("stitch-wallet-stat-value", summary.totalStakedUsdc)}>
                {fmtUsdc(summary.totalStakedUsdc)}
              </span>
            </div>
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryRealizedPnl}</span>
              <span className={walletNumClass("stitch-wallet-stat-value", summary.realizedPnlUsdc)}>
                {fmtPnl(summary.realizedPnlUsdc, c.pnlPending, c.pnlEstimated, false)}
              </span>
              {summary.settledCount > 0 ? (
                <span className="stitch-wallet-stat-hint">
                  {c.summaryRecord(summary.wonCount, summary.lostCount)}
                </span>
              ) : null}
            </div>
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryUnrealizedPnl}</span>
              <span className={walletNumClass("stitch-wallet-stat-value", summary.unrealizedPnlUsdc)}>
                {fmtPnl(summary.unrealizedPnlUsdc, c.pnlPending, c.pnlEstimated, true)}
              </span>
            </div>
          </div>

          <section className="stitch-wallet-activity">
            <div className="stitch-wallet-activity-head">
              <div>
                <h2 className="stitch-wallet-activity-title">{c.activityTitle}</h2>
                <p className="stitch-wallet-activity-lead">{c.activityLead}</p>
              </div>
              <button
                type="button"
                className="stitch-wallet-refresh-btn"
                onClick={() => void refresh()}
                disabled={loading}
              >
                {loading ? c.loading : c.refresh}
              </button>
            </div>

            {loading && bets.length === 0 ? (
              <p className="stitch-panel-empty">{c.loading}</p>
            ) : error ? (
              <div className="stitch-wallet-empty">
                <p className="stitch-wallet-empty-title">{c.syncFailed}</p>
                <button type="button" className="stitch-wallet-refresh-btn" onClick={() => void refresh()}>
                  {c.refresh}
                </button>
              </div>
            ) : bets.length === 0 ? (
              <div className="stitch-wallet-empty">
                <p className="stitch-wallet-empty-title">{c.activityEmpty}</p>
                <p className="stitch-wallet-empty-hint">{c.activityEmptyHint}</p>
                <Link href="/?tab=matches" className="stitch-link-btn">
                  {c.viewMatch}
                </Link>
              </div>
            ) : (
              <ul className="stitch-wallet-activity-list">
                {visibleBets.map((bet) => {
                  const tone = statusTone(bet.status);
                  const displayAmount = walletBetDisplayAmount(bet);
                  const pnlEstimated =
                    bet.status === "claimable" || bet.status === "open" || bet.status === "refund_eligible";
                  const showNetHint =
                    bet.status === "won" && bet.pnlUsdc !== null && bet.estimatedPayoutUsdc !== null;
                  const matchHref = `/match/${bet.fixtureId}`;
                  const homeLabel = teamLabel(bet.homeTeam, lang);
                  const awayLabel = teamLabel(bet.awayTeam, lang);
                  const pickLabel = betPickCountryLabel(lang, bet.side, bet.homeTeam, bet.awayTeam);
                  return (
                    <li key={bet.fixtureId} className="stitch-wallet-activity-item">
                      <div className="stitch-wallet-activity-main">
                        <Link href={matchHref} className="stitch-wallet-activity-match">
                          {homeLabel} vs {awayLabel}
                        </Link>
                        <div className="stitch-wallet-activity-meta">
                          <span className="stitch-wallet-activity-pick">
                            {c.colPick}: {pickLabel}
                          </span>
                          <span className={walletNumClass("stitch-wallet-activity-stake", bet.stakeUsdc)}>
                            {fmtUsdc(bet.stakeUsdc)} USDC
                          </span>
                        </div>
                      </div>
                      <div className="stitch-wallet-activity-side">
                        <span className={`stitch-wallet-status stitch-wallet-status--${tone}`}>
                          {betStatusLabel(lang, bet.status)}
                        </span>
                        <span className={walletNumClass("stitch-wallet-pnl", displayAmount)}>
                          {fmtPnl(displayAmount, c.pnlPending, c.pnlEstimated, pnlEstimated)}
                        </span>
                        {showNetHint && bet.pnlUsdc !== null ? (
                          <span className="stitch-wallet-pnl-net">{c.pnlNet(bet.pnlUsdc)}</span>
                        ) : null}
                        <WalletBetEscrowAction bet={bet} onDone={() => void refresh()} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {bets.length > ACTIVITY_COLLAPSED_COUNT ? (
              <button
                type="button"
                className="stitch-wallet-activity-expand"
                onClick={() => setActivityExpanded((v) => !v)}
                aria-expanded={activityExpanded}
              >
                <span>
                  {activityExpanded
                    ? c.activityCollapseAll
                    : `${c.activityExpandAll} (+${hiddenBetCount})`}
                </span>
                <svg
                  className={`stitch-wallet-activity-expand-icon${activityExpanded ? " stitch-wallet-activity-expand-icon--open" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            ) : null}

            {updatedLabel ? <p className="stitch-wallet-updated">{updatedLabel}</p> : null}
          </section>

          <div className="stitch-wallet-header-pill-hint">
            <LiquidGlassPill variant="wallet" className="stitch-wallet-inline-pill" style={{ opacity: 0.7 }}>
              {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""}
            </LiquidGlassPill>
          </div>
        </>
      )}

      <StitchPanelFooter />
    </div>
  );
}
