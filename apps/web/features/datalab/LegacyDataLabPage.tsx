import { useEffect, useMemo, useState } from "react";
import bs58 from "bs58";
import type { PublicEdgeSummaryItem, Fixture } from "@natt-pundit/contracts";
import { convictionRank } from "@/lib/edgeDisplay";
import {
  fetchClvVerdict,
  fetchDataIndex,
  fetchDataProofs,
  fetchEdgeSummary,
  fetchFixtures,
} from "@/lib/api";
import { ui } from "@/lib/i18n";
import { settlementExplorerLink } from "@/lib/solanaExplorer";
import { usePresent } from "@/components/present/PresentProvider";
import { usePageVisible } from "@/lib/usePageVisible";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { useAppKit } from "@reown/appkit/react";
import { ensureNattPunditAppKit } from "@/lib/nattPunditAppKit";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type StreamRow = {
  name: string;
  records: number;
  bytes: number;
  firstTs?: string;
  lastTs?: string;
};
type DataIndex = { streams: StreamRow[]; generatedAt: string };
type ClvVerdict = {
  verdict: string;
  n: number;
  nMin: number;
  nMinDisplay?: number;
  indicative?: boolean;
  meanClv: number;
  ciLo: number;
  ciHi: number;
  pctBeats: number;
  formulaVersion?: string;
  generatedAt: string;
};
type ProofRow = {
  ts: string;
  fixtureId: string;
  seq?: number;
  merkleRoot: string;
  leafHash: string;
  validated: boolean;
  programId?: string;
};
type ProofsResp = { proofs: ProofRow[]; total: number; generatedAt: string };

function fmtBytes(b: number): string {
  if (b <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  return `${(b / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function fmtTime(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pct(x: number, dp = 1): string {
  return `${(x * 100).toFixed(dp)}%`;
}

function pp(x: number, dp = 1): string {
  const v = x * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(dp)} pp`;
}

export function LegacyDataLabPage() {
  const { lang } = usePresent();
  const t = ui(lang);
  const visible = usePageVisible();
  const { wallet, hasProjectId } = useSolanaConnectedWallet();
  const { open } = useAppKit();

  const [index, setIndex] = useState<DataIndex | null>(null);
  const [clv, setClv] = useState<ClvVerdict | null>(null);
  const [proofs, setProofs] = useState<ProofsResp | null>(null);
  const [summary, setSummary] = useState<PublicEdgeSummaryItem[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [err, setErr] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportErr, setExportErr] = useState("");

  const load = () => {
    Promise.all([
      fetchDataIndex(),
      fetchClvVerdict(),
      fetchDataProofs(12),
      fetchEdgeSummary(),
      fetchFixtures(),
    ])
      .then(([idx, clvV, pr, sum, fx]) => {
        setIndex(idx as DataIndex);
        setClv(clvV as ClvVerdict);
        setProofs(pr as ProofsResp);
        setSummary(((sum as { items?: PublicEdgeSummaryItem[] }).items ?? []) as PublicEdgeSummaryItem[]);
        const map = new Map<string, string>();
        for (const f of (fx as { fixtures: Fixture[] }).fixtures ?? []) {
          map.set(f.fixtureId, `${f.homeTeam} — ${f.awayTeam}`);
        }
        setNames(map);
        setErr("");
      })
      .catch(() => setErr(t.dataUnavailable));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const signals = useMemo(
    () =>
      [...summary]
        .filter((s) => s.hasOdds)
        .sort((a, b) => convictionRank(b.conviction) - convictionRank(a.conviction)),
    [summary],
  );

  const clvVerified = clv?.verdict === "clv_verified";
  const clvProgress = clv ? Math.min(1, clv.n / clv.nMin) : 0;
  const clvIndicative = !!clv && (clv.indicative ?? clv.n < (clv.nMinDisplay ?? 30));
  const clvValueClass = `datas-stat-value mono${clvIndicative ? " datas-stat-muted" : ""}`;

  async function onExportZip() {
    setExportErr("");
    if (!wallet) {
      if (hasProjectId) {
        ensureNattPunditAppKit();
        open({ view: "Connect", namespace: "solana" });
      } else setExportErr(t.datasExportConnect);
      return;
    }
    setExportBusy(true);
    try {
      const chRes = await fetch(`${BASE_PATH}/api/datas/export/challenge`);
      if (!chRes.ok) throw new Error("challenge_failed");
      const ch = (await chRes.json()) as { message: string };
      const messageBytes = new TextEncoder().encode(ch.message);
      const signature = await wallet.signMessage(messageBytes);
      const verifyRes = await fetch(`${BASE_PATH}/api/datas/export/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pubkey: wallet.address,
          message: ch.message,
          signature: bs58.encode(signature),
        }),
      });
      if (!verifyRes.ok) {
        setExportErr(t.datasExportDenied);
        return;
      }
      const { downloadUrl } = (await verifyRes.json()) as { downloadUrl: string };
      window.location.assign(downloadUrl);
    } catch {
      setExportErr(t.datasExportDenied);
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <div className="datas-page">
      <section className="datas-hero hero-gradient">
        <p className="datas-kicker">{t.datasKicker}</p>
        <h1>{t.datasTitle}</h1>
        <p className="datas-lead">{t.datasLead}</p>
        {index ? <p className="datas-updated">{t.datasUpdated(fmtTime(index.generatedAt))}</p> : null}
        {err ? <p className="match-error">{err}</p> : null}
        <div className="datas-export">
          <button
            type="button"
            className="datas-export-btn"
            disabled={exportBusy}
            onClick={() => void onExportZip()}
          >
            {exportBusy ? t.datasExportBusy : wallet ? t.datasExport : t.datasExportConnect}
          </button>
          <span className="datas-export-hint">{t.datasExportHint}</span>
          {exportErr ? <p className="match-error">{exportErr}</p> : null}
        </div>
      </section>

      {/* CLV verdict */}
      <section className="datas-clv glass-panel">
        <div className="datas-clv-head">
          <div>
            <h2 className="section-title">{t.datasClvTitle}</h2>
            <p className="datas-section-lead">{t.datasClvLead}</p>
          </div>
          <span className={`clv-badge ${clvVerified ? "clv-badge-ok" : "clv-badge-wait"}`}>
            {clvVerified ? t.clvVerified : t.clvNotYet}
          </span>
        </div>

        <div className="datas-clv-grid">
          <div className="datas-stat">
            <span className="datas-stat-label">{t.datasClvN}</span>
            <span className="datas-stat-value mono">{clv?.n ?? "—"}</span>
          </div>
          <div className="datas-stat">
            <span className="datas-stat-label">{t.datasClvMean}</span>
            <span className={clvValueClass}>{clv ? pp(clv.meanClv, 2) : "—"}</span>
          </div>
          <div className="datas-stat">
            <span className="datas-stat-label">{t.datasClvCi}</span>
            <span className={clvValueClass}>
              {clv ? `[${pp(clv.ciLo, 2)}, ${pp(clv.ciHi, 2)}]` : "—"}
            </span>
          </div>
          <div className="datas-stat">
            <span className="datas-stat-label">{t.datasClvBeats}</span>
            <span className={clvValueClass}>{clv ? pct(clv.pctBeats) : "—"}</span>
          </div>
        </div>

        {clvIndicative ? <p className="datas-clv-indicative">{t.datasClvIndicative}</p> : null}

        <div className="datas-progress" role="progressbar" aria-valuenow={Math.round(clvProgress * 100)}>
          <div className="datas-progress-fill" style={{ width: `${clvProgress * 100}%` }} />
        </div>
        <p className="datas-progress-label mono">
          {clv ? t.datasClvProgress(clv.n, clv.nMin) : ""}
        </p>
      </section>

      {/* Live edge signals */}
      <section className="datas-block glass-panel">
        <h2 className="section-title">{t.datasSignalsTitle}</h2>
        <p className="datas-section-lead">{t.datasSignalsLead}</p>
        <div className="datas-table-wrap">
          <table className="datas-table">
            <thead>
              <tr>
                <th>{t.colMatch}</th>
                <th>conviction</th>
                <th>{t.colVerdict}</th>
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="datas-empty">
                    {t.datasEmpty}
                  </td>
                </tr>
              ) : (
                signals.map((s) => (
                  <tr key={s.fixtureId}>
                    <td>{names.get(s.fixtureId) ?? s.fixtureId}</td>
                    <td className="mono">{s.conviction}</td>
                    <td>
                      <span
                        className={`verdict-pill ${
                          s.verdict === "SETUP" ? "verdict-setup" : "verdict-hold"
                        }`}
                      >
                        {s.verdict === "SETUP" ? t.verdictSetup : t.verdictHold}
                        {s.verdict === "SETUP" && s.direction && s.direction !== "none"
                          ? ` · ${s.direction}`
                          : ""}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dataset streams */}
      <section className="datas-block glass-panel">
        <h2 className="section-title">{t.datasStreamsTitle}</h2>
        <p className="datas-section-lead">{t.datasStreamsLead}</p>
        <div className="datas-table-wrap">
          <table className="datas-table">
            <thead>
              <tr>
                <th>{t.colStream}</th>
                <th className="num">{t.colRecords}</th>
                <th className="num">{t.colSize}</th>
                <th>{t.colFirst}</th>
                <th>{t.colLast}</th>
              </tr>
            </thead>
            <tbody>
              {(index?.streams ?? []).map((s) => (
                <tr key={s.name}>
                  <td className="mono datas-stream-name">{s.name}</td>
                  <td className="num mono">{s.records.toLocaleString()}</td>
                  <td className="num mono">{fmtBytes(s.bytes)}</td>
                  <td className="mono datas-dim">{fmtTime(s.firstTs)}</td>
                  <td className="mono datas-dim">{fmtTime(s.lastTs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Merkle anchors */}
      <section className="datas-block glass-panel">
        <h2 className="section-title">{t.datasProofsTitle}</h2>
        <p className="datas-section-lead">{t.datasProofsLead}</p>
        <div className="datas-table-wrap">
          <table className="datas-table">
            <thead>
              <tr>
                <th>{t.colSeq}</th>
                <th>{t.colMatch}</th>
                <th>{t.colRoot}</th>
                <th>{t.colStatus}</th>
                <th>{t.colProgram}</th>
              </tr>
            </thead>
            <tbody>
              {!proofs || proofs.proofs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="datas-empty">
                    {t.datasNoProofs}
                  </td>
                </tr>
              ) : (
                proofs.proofs.map((p) => {
                  const link = settlementExplorerLink(p);
                  return (
                    <tr key={`${p.seq ?? "na"}-${p.merkleRoot}`}>
                      <td className="mono">{p.seq ?? "—"}</td>
                      <td>{names.get(p.fixtureId) ?? p.fixtureId}</td>
                      <td className="mono datas-root">{p.merkleRoot.slice(0, 18)}…</td>
                      <td>
                        <span className={p.validated ? "verdict-pill verdict-setup" : "verdict-pill verdict-hold"}>
                          {p.validated ? "verified" : "pending"}
                        </span>
                      </td>
                      <td>
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" className="proof-link">
                            {t.explorerLink}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
