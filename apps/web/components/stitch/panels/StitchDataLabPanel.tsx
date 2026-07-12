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
import { teamLabel } from "@/lib/teamI18n";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";

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
  generatedAt: string;
};
type ProofRow = {
  ts: string;
  fixtureId: string;
  seq?: number;
  merkleRoot: string;
  validated: boolean;
  explorerUrl?: string;
  txSig?: string;
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
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function pp(x: number): string {
  const v = x * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)} pp`;
}

export function StitchDataLabPanel() {
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
      fetchDataProofs(8),
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
          map.set(f.fixtureId, `${teamLabel(f.homeTeam, lang)} — ${teamLabel(f.awayTeam, lang)}`);
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
        .sort((a, b) => convictionRank(b.conviction) - convictionRank(a.conviction))
        .slice(0, 8),
    [summary],
  );

  const clvVerified = clv?.verdict === "clv_verified";
  const clvProgress = clv ? Math.min(1, clv.n / clv.nMin) : 0;
  const clvIndicative = !!clv && (clv.indicative ?? clv.n < (clv.nMinDisplay ?? 30));

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
    <div className="stitch-panel stitch-panel--datalab">
      <header className="stitch-datalab-hero">
        <h1 className="stitch-home-title">{t.datasTitle}</h1>
        <p className="stitch-home-lead">{t.datasLead}</p>
        {index ? <p className="stitch-meta-line">{t.datasUpdated(fmtTime(index.generatedAt))}</p> : null}
        {err ? <p className="stitch-panel-error">{err}</p> : null}
        <button
          type="button"
          className="stitch-action-btn"
          disabled={exportBusy}
          onClick={() => void onExportZip()}
        >
          {exportBusy ? t.datasExportBusy : wallet ? t.datasExport : t.datasExportConnect}
        </button>
        <p className="stitch-meta-line">{t.datasExportHint}</p>
        {exportErr ? <p className="stitch-panel-error">{exportErr}</p> : null}
      </header>

      <section className="stitch-glass-card">
        <div className="stitch-card-head">
          <h2>{t.datasClvTitle}</h2>
          <span className={`stitch-badge ${clvVerified ? "stitch-badge--ok" : "stitch-badge--wait"}`}>
            {clvVerified ? t.clvVerified : t.clvNotYet}
          </span>
        </div>
        <p className="stitch-card-lead">{t.datasClvLead}</p>
        <div className="stitch-stat-grid">
          <div>
            <span className="stitch-stat-label">{t.datasClvN}</span>
            <span className="stitch-stat-value">{clv?.n ?? "—"}</span>
          </div>
          <div>
            <span className="stitch-stat-label">{t.datasClvMean}</span>
            <span className="stitch-stat-value">{clv ? pp(clv.meanClv) : "—"}</span>
          </div>
          <div>
            <span className="stitch-stat-label">{t.datasClvBeats}</span>
            <span className="stitch-stat-value">{clv ? pct(clv.pctBeats) : "—"}</span>
          </div>
        </div>
        {clvIndicative ? <p className="stitch-meta-line">{t.datasClvIndicative}</p> : null}
        <div className="stitch-progress">
          <div className="stitch-progress-fill" style={{ width: `${clvProgress * 100}%` }} />
        </div>
        <p className="stitch-meta-line">{clv ? t.datasClvProgress(clv.n, clv.nMin) : ""}</p>
      </section>

      <section className="stitch-glass-card">
        <h2>{t.datasSignalsTitle}</h2>
        <p className="stitch-card-lead">{t.datasSignalsLead}</p>
        <ul className="stitch-simple-list">
          {signals.length === 0 ? (
            <li>{t.datasEmpty}</li>
          ) : (
            signals.map((s) => (
              <li key={s.fixtureId}>
                <span>{names.get(s.fixtureId) ?? s.fixtureId}</span>
                <span className={`stitch-verdict ${s.verdict === "SETUP" ? "stitch-verdict--setup" : ""}`}>
                  {s.verdict} · {s.conviction}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="stitch-glass-card">
        <h2>{t.datasStreamsTitle}</h2>
        <p className="stitch-card-lead">{t.datasStreamsLead}</p>
        <ul className="stitch-simple-list stitch-simple-list--mono">
          {(index?.streams ?? []).map((s) => (
            <li key={s.name}>
              <span>{s.name}</span>
              <span>
                {s.records.toLocaleString()} · {fmtBytes(s.bytes)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="stitch-glass-card">
        <h2>{t.datasProofsTitle}</h2>
        <p className="stitch-card-lead">{t.datasProofsLead}</p>
        <ul className="stitch-simple-list stitch-simple-list--mono">
          {!proofs || proofs.proofs.length === 0 ? (
            <li>{t.datasNoProofs}</li>
          ) : (
            proofs.proofs.map((p) => {
              const link = settlementExplorerLink(p);
              return (
                <li key={`${p.seq ?? "na"}-${p.merkleRoot}`}>
                  <span>{names.get(p.fixtureId) ?? p.fixtureId}</span>
                  <span>
                    {p.validated ? "verified" : "pending"}
                    {link ? (
                      <>
                        {" · "}
                        <a href={link} target="_blank" rel="noreferrer" className="stitch-inline-link">
                          {t.explorerLink}
                        </a>
                      </>
                    ) : null}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <StitchPanelFooter />
    </div>
  );
}
