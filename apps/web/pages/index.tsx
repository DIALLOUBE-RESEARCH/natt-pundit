import { useEffect, useMemo, useState } from "react";
import type { EdgeSummaryItem, EdgeVerdict, Fixture } from "@natt-pundit/contracts";
import { MatchCard } from "@/components/MatchCard";
import { fetchEdgeSummary, fetchFixtures } from "@/lib/api";
import { usePageVisible } from "@/lib/usePageVisible";

function sortFixtures(fixtures: Fixture[], edges: Map<string, EdgeSummaryItem>): Fixture[] {
  const rank = (f: Fixture) => {
    const edge = edges.get(f.fixtureId);
    if (edge?.verdict === "SETUP") return 0;
    if (f.status === "live") return 1;
    if (f.status === "scheduled") return 2;
    return 3;
  };
  return [...fixtures].sort((a, b) => {
    const dr = rank(a) - rank(b);
    if (dr !== 0) return dr;
    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

export default function HomePage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [edgeMap, setEdgeMap] = useState<Map<string, EdgeSummaryItem>>(new Map());
  const [source, setSource] = useState("");
  const [err, setErr] = useState("");
  const visible = usePageVisible();

  const load = () => {
    Promise.all([fetchFixtures(), fetchEdgeSummary()])
      .then(([fixtureData, summary]) => {
        setFixtures(fixtureData.fixtures);
        setSource(fixtureData.source);
        const map = new Map<string, EdgeSummaryItem>();
        for (const item of summary.items ?? []) {
          map.set(item.fixtureId, item);
        }
        setEdgeMap(map);
        setErr("");
      })
      .catch(() => setErr("Data indisponible"));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [visible]);

  const ordered = useMemo(() => sortFixtures(fixtures, edgeMap), [fixtures, edgeMap]);

  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="home-kicker">TxODDS · Prediction Markets & Settlement</p>
        <h1>Natt Settlement</h1>
        <p className="home-lead">
          Shin consensus, two-source logit combine, SETUP/HOLD edge. Merkle settlement viewer.
        </p>
        <p className="home-meta">Source: {source || "—"}</p>
      </section>

      <div className="home-grid">
        {err && <p className="match-error">{err}</p>}
        {ordered.map((f) => {
          const summary = edgeMap.get(f.fixtureId);
          const edge: EdgeVerdict | undefined = summary
            ? {
                fixtureId: f.fixtureId,
                verdict: summary.verdict,
                edge_score: summary.edge_score,
                why: summary.verdict === "SETUP" ? "edge_above_epsilon" : "hold",
                ts: new Date().toISOString(),
                pi_tx: summary.pi_tx,
                pi_model: summary.pi_model,
                c: summary.c,
                epsilon_net: 0.03,
                direction: summary.direction,
              }
            : undefined;
          return <MatchCard key={f.fixtureId} fixture={f} edge={edge} />;
        })}
      </div>
    </div>
  );
}
