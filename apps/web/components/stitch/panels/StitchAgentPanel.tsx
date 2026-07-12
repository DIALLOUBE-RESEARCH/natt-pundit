"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";
import { useWalletPortfolio } from "@/hooks/useWalletPortfolio";
import { agentDashCopy } from "@/lib/agentDashI18n";
import { explorerClusterQuery } from "@/lib/escrowCluster";
import { teamLabel } from "@/lib/teamI18n";
import { betPickCountryLabel, betStatusLabel, walletCopy } from "@/lib/walletI18n";
import type { BetLedgerStatus } from "@/lib/walletPortfolio";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type AgentProfile = {
  wallet: string;
  label: string;
  mcpUrl: string;
};

function fmtUsdc(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtSol(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
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

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function StitchAgentPanel() {
  const { lang } = usePresent();
  const a = agentDashCopy(lang);
  const c = walletCopy(lang);

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [profileState, setProfileState] = useState<"loading" | "ready" | "missing">("loading");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_PATH}/api/agent/profile`, { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setProfileState("missing");
          return;
        }
        const json = (await res.json()) as AgentProfile;
        setProfile(json);
        setProfileState("ready");
      })
      .catch(() => {
        if (!cancelled) setProfileState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { balances, bets, summary, loading, error, updatedAt, cluster, refresh } =
    useWalletPortfolio(profile?.wallet ?? null);

  const explorerUrl = useMemo(() => {
    if (!profile) return null;
    return `https://explorer.solana.com/address/${profile.wallet}${explorerClusterQuery()}`;
  }, [profile]);

  const copyWallet = useCallback(async () => {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.wallet);
    setToast(a.copiedToast);
    window.setTimeout(() => setToast(null), 4000);
  }, [profile, a.copiedToast]);

  const clusterLabel = cluster === "devnet" ? c.clusterDevnet : c.clusterMainnet;
  const updatedLabel = updatedAt
    ? c.updatedAt(updatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))
    : null;

  return (
    <div className="stitch-panel stitch-panel--wallet stitch-panel--agent">
      <section className="stitch-wallet-hero">
        <p className="stitch-wallet-kicker">{a.kicker}</p>
        <div className="stitch-wallet-hero-row">
          <div>
            <h1 className="stitch-wallet-title">{a.title}</h1>
            <p className="stitch-wallet-lead">{a.lead}</p>
          </div>
          <span className="stitch-wallet-cluster-badge">{clusterLabel}</span>
        </div>
      </section>

      {profileState === "loading" ? (
        <p className="stitch-panel-empty">{a.loadingProfile}</p>
      ) : profileState === "missing" || !profile ? (
        <div className="stitch-wallet-empty">
          <p className="stitch-wallet-empty-title">{a.notConfiguredTitle}</p>
          <p className="stitch-wallet-empty-hint">{a.notConfiguredBody}</p>
        </div>
      ) : (
        <>
          <section className="stitch-wallet-balance-card">
            <p className="stitch-wallet-balance-label">{a.identityTitle}</p>
            <div className="stitch-agent-identity">
              <span className="stitch-wallet-status stitch-wallet-status--win">{a.badge}</span>
              <p className="stitch-agent-identity-name">{profile.label}</p>
            </div>
            <dl className="stitch-agent-identity-list">
              <div className="stitch-agent-identity-row">
                <dt>{a.walletLabel}</dt>
                <dd>
                  <code title={profile.wallet}>{shortAddress(profile.wallet)}</code>
                  <button type="button" className="stitch-wallet-refresh-btn" onClick={() => void copyWallet()}>
                    {a.copyWallet}
                  </button>
                </dd>
              </div>
              <div className="stitch-agent-identity-row">
                <dt>{a.mcpLabel}</dt>
                <dd>
                  <code title={profile.mcpUrl}>{profile.mcpUrl}</code>
                </dd>
              </div>
            </dl>
            {explorerUrl ? (
              <a className="stitch-link-btn" href={explorerUrl} target="_blank" rel="noreferrer">
                {a.explorerCta}
              </a>
            ) : null}
          </section>

          <section className="stitch-wallet-balance-card">
            <p className="stitch-wallet-balance-label">{c.totalBalance}</p>
            <div className="stitch-wallet-token-row">
              <div className="stitch-wallet-token-chip">
                <span className="stitch-wallet-token-name">{c.solBalance}</span>
                <span className="stitch-wallet-token-value">
                  {balances.sol !== null ? `${fmtSol(balances.sol)} SOL` : c.solUnavailable}
                </span>
              </div>
              <div className="stitch-wallet-token-chip stitch-wallet-token-chip--accent">
                <span className="stitch-wallet-token-name">{c.usdcBalance}</span>
                <span className="stitch-wallet-token-value">
                  {balances.usdc !== null ? `${fmtUsdc(balances.usdc)} USDC` : c.usdcUnavailable}
                </span>
              </div>
            </div>
          </section>

          <div className="stitch-wallet-stats-grid">
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryOpen}</span>
              <span className="stitch-wallet-stat-value">{summary.openCount}</span>
            </div>
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryStaked}</span>
              <span className="stitch-wallet-stat-value">{fmtUsdc(summary.totalStakedUsdc)}</span>
            </div>
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryRealizedPnl}</span>
              <span className="stitch-wallet-stat-value">
                {fmtPnl(summary.realizedPnlUsdc, c.pnlPending, c.pnlEstimated, false)}
              </span>
            </div>
            <div className="stitch-wallet-stat">
              <span className="stitch-wallet-stat-label">{c.summaryUnrealizedPnl}</span>
              <span className="stitch-wallet-stat-value">
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
              </div>
            ) : (
              <ul className="stitch-wallet-activity-list">
                {bets.map((bet) => {
                  const tone = statusTone(bet.status);
                  const pnlEstimated =
                    bet.status === "claimable" || bet.status === "open" || bet.status === "refund_eligible";
                  const matchHref = `${BASE_PATH}/match/${bet.fixtureId}`;
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
                          <span className="stitch-wallet-activity-stake">
                            {fmtUsdc(bet.stakeUsdc)} USDC
                          </span>
                        </div>
                      </div>
                      <div className="stitch-wallet-activity-side">
                        <span className={`stitch-wallet-status stitch-wallet-status--${tone}`}>
                          {betStatusLabel(lang, bet.status)}
                        </span>
                        <span className="stitch-wallet-pnl">
                          {fmtPnl(bet.pnlUsdc, c.pnlPending, c.pnlEstimated, pnlEstimated)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {updatedLabel ? <p className="stitch-wallet-updated">{updatedLabel}</p> : null}
          </section>

          <section className="stitch-wallet-balance-card">
            <p className="stitch-wallet-balance-label">{a.policyTitle}</p>
            <p className="stitch-agent-policy-body">{a.policyBody}</p>
          </section>
        </>
      )}

      {toast ? <p className="agent-connect-toast">{toast}</p> : null}
      <StitchPanelFooter />
    </div>
  );
}
