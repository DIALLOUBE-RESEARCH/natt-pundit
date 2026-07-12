import type { SettlementProof } from "@natt-pundit/contracts";
import { useCallback, useEffect, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import { fetchSettlementProof } from "@/lib/api";
import { shell } from "@/lib/appShellI18n";
import { ui } from "@/lib/i18n";
import { settlementExplorerLink } from "@/lib/solanaExplorer";
import { usePageVisible } from "@/lib/usePageVisible";

type Props = {
  fixtureId: string;
  fixtureStatus?: "scheduled" | "live" | "finished";
  score?: { home: number; away: number };
};

const PROOF_POLL_MS = 15_000;

function proofKey(p: SettlementProof): string {
  return `${p.seq ?? "na"}:${p.merkleRoot}:${p.leafHash}`;
}

function proofScoreLine(score: { home: number; away: number }): string {
  return `${score.home}/${score.away}`;
}

function proofMatchesScore(
  proof: SettlementProof,
  score: { home: number; away: number },
): boolean {
  const parts = proof.statValue.split("/").map((s) => Number.parseInt(s.trim(), 10));
  if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
    return parts[0] === score.home && parts[1] === score.away;
  }
  const single = Number.parseInt(proof.statValue, 10);
  if (!Number.isFinite(single)) return true;
  return single === score.home || single === score.away;
}

function isProofPendingState(
  proof: SettlementProof,
  fixtureStatus?: "scheduled" | "live" | "finished",
): boolean {
  if (proof.validated) return false;
  if (proof.verifyReason === "proof_pending_prematch") return true;
  return (
    fixtureStatus !== "finished" &&
    proof.source === "txline" &&
    (proof.verifyReason === "stat_proof_mismatch" || proof.statValue === "0/0")
  );
}
function mapProofError(e: unknown, t: ReturnType<typeof ui>): string {
  const msg = e instanceof Error ? e.message : "proof_failed";
  if (
    msg === "proof_pending_first_score" ||
    msg === "no_score_seq" ||
    msg === "proof_pending_no_snapshot"
  ) {
    return t.proofPending;
  }
  return t.proofUnavailable;
}

export function SettlementProofPanel({ fixtureId, fixtureStatus, score }: Props) {
  const [proof, setProof] = useState<SettlementProof | null>(null);
  const [history, setHistory] = useState<SettlementProof[]>([]);
  const [pendingMsg, setPendingMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const visible = usePageVisible();
  const { lang } = usePresent();
  const t = ui(lang);
  const s = shell(lang);

  const pushHistory = useCallback((next: SettlementProof) => {
    setHistory((prev) => {
      const key = proofKey(next);
      if (prev.some((p) => proofKey(p) === key)) return prev;
      return [next, ...prev].slice(0, 12);
    });
  }, []);

  const loadProof = useCallback(async () => {
    if (!fixtureId) return;
    try {
      const next = await fetchSettlementProof(fixtureId);
      setProof(next);
      pushHistory(next);
      setPendingMsg("");
    } catch (e: unknown) {
      const msg = mapProofError(e, t);
      setPendingMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [fixtureId, pushHistory, t]);

  useEffect(() => {
    if (!fixtureId) return;
    setLoading(true);
    void loadProof();
  }, [fixtureId, loadProof]);

  useEffect(() => {
    if (!fixtureId || !visible) return;
    const id = window.setInterval(() => {
      void loadProof();
    }, PROOF_POLL_MS);
    return () => window.clearInterval(id);
  }, [fixtureId, visible, loadProof]);

  if (loading && !proof) {
    return <p className="match-loading">{t.proofLoading}</p>;
  }

  if (!proof) {
    return (
      <div className="proof-panel glass-panel">
        <p className="match-error">{pendingMsg || t.proofPending}</p>
      </div>
    );
  }

  const explorer = settlementExplorerLink(proof);
  const sourceLabel = proof.source === "txline" ? t.sourceTxline : t.sourceMock;
  const scoreMismatch =
    score && proof.source === "txline" && !proofMatchesScore(proof, score);
  const proofPending = isProofPendingState(proof, fixtureStatus);
  const validationLabel = proof.validated
    ? t.statValidYes
    : proofPending
      ? fixtureStatus === "scheduled"
        ? t.proofPendingPrematch
        : t.proofPending
      : proof.source === "txline"
        ? scoreMismatch
          ? t.statScoreMismatch(proof.statValue, proofScoreLine(score))
          : proof.verifyReason && proof.verifyReason !== "ok"
            ? `${t.statValidFailed} (${proof.verifyReason})`
            : t.statValidWait
        : t.statValidMock;

  const hashLink = (hash: string) =>
    explorer ? (
      <a href={explorer} target="_blank" rel="noreferrer" className="proof-link proof-hash-link">
        {hash}
      </a>
    ) : (
      hash
    );

  return (
    <section className="proof-panel glass-panel">
      <h2 className="section-title">{t.settlementTitle}</h2>
      {pendingMsg ? <p className="proof-stale-hint">{pendingMsg}</p> : null}
      <p className="proof-source">
        {s.proofSourcePrefix} <strong>{sourceLabel}</strong>
        {proof.seq !== undefined ? ` · seq ${proof.seq}` : null}
      </p>
      <dl className="proof-dl">
        <div>
          <dt>{t.stat}</dt>
          <dd>
            {proof.statType}: {proof.statValue}
          </dd>
        </div>
        <div>
          <dt>{t.validOnchain}</dt>
          <dd>
            {proof.validated ? (
              <span className="proof-valid-badge">{validationLabel}</span>
            ) : (
              <span className={proofPending ? "proof-stale-hint" : scoreMismatch ? "proof-stale-hint" : undefined}>
                {validationLabel}
              </span>
            )}
          </dd>
        </div>
        {explorer ? (
          <div>
            <dt>{t.explorer}</dt>
            <dd>
              <a href={explorer} target="_blank" rel="noreferrer" className="proof-link">
                {t.explorerLink}
              </a>
            </dd>
          </div>
        ) : null}
        <div className="proof-dl-wide">
          <dt>{t.merkleRoot}</dt>
          <dd className="mono">{hashLink(proof.merkleRoot)}</dd>
        </div>
        <div className="proof-dl-wide">
          <dt>{t.leaf}</dt>
          <dd className="mono">{hashLink(proof.leafHash)}</dd>
        </div>
        <div className="proof-dl-wide">
          <dt>{t.proofPath}</dt>
          <dd className="mono proof-path">
            {proof.proof.map((node, i) => (
              <span key={`${node}-${i}`}>
                {i > 0 ? " → " : null}
                {hashLink(node)}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      {history.length > 1 ? (
        <div className="proof-history">
          <h3 className="proof-history-title">{s.proofHistoryTitle}</h3>
          <ul className="proof-history-list">
            {history.map((item) => {
              const itemExplorer = settlementExplorerLink(item);
              return (
                <li key={proofKey(item)} className="proof-history-item">
                  <span className="mono">
                    seq {item.seq ?? "—"} · {item.statType}={item.statValue}
                  </span>
                  <span className={item.validated ? "proof-valid-badge" : "proof-history-pending"}>
                    {item.validated
                      ? s.proofVerifiedBadge
                      : isProofPendingState(item, fixtureStatus)
                        ? s.proofPendingBadge
                        : s.proofPendingBadge}
                  </span>
                  {itemExplorer ? (
                    <a
                      href={itemExplorer}
                      target="_blank"
                      rel="noreferrer"
                      className="mono proof-link proof-history-root"
                    >
                      {item.merkleRoot.slice(0, 18)}…
                    </a>
                  ) : (
                    <span className="mono proof-history-root">{item.merkleRoot.slice(0, 18)}…</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
