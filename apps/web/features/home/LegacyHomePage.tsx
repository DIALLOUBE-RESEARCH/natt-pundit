import { useEffect, useMemo, useState } from "react";
import type { PublicEdgeSummaryItem, Fixture, PublicEdgeVerdict } from "@natt-pundit/contracts";
import { AgentConnectButton } from "@/components/AgentConnectButton";
import { MatchCard } from "@/components/MatchCard";
import { usePresent } from "@/components/present/PresentProvider";
import { fetchEdgeSummary, fetchFixtures } from "@/lib/api";
import { ui } from "@/lib/i18n";
import { useAgentConnectOpen } from "@/lib/agentConnectOpen";
import { useMatchFavorites } from "@/lib/matchFavorites";
import { usePageVisible } from "@/lib/usePageVisible";

function sortFixtures(
  fixtures: Fixture[],
  edges: Map<string, PublicEdgeSummaryItem>,
  favorites: string[],
): Fixture[] {
  const favOrder = new Map(favorites.map((id, i) => [id, i]));
  const statusOf = (f: Fixture) => edges.get(f.fixtureId)?.status ?? f.status;
  const rank = (f: Fixture) => {
    const status = statusOf(f);
    if (status === "live") return 0;
    if (status === "scheduled") return 1;
    return 2;
  };

  return [...fixtures].sort((a, b) => {
    const af = favOrder.get(a.fixtureId);
    const bf = favOrder.get(b.fixtureId);
    const aFav = af !== undefined;
    const bFav = bf !== undefined;
    if (aFav && bFav) return af - bf;
    if (aFav) return -1;
    if (bFav) return 1;

    const dr = rank(a) - rank(b);
    if (dr !== 0) return dr;

    const at = new Date(a.kickoffAt).getTime();
    const bt = new Date(b.kickoffAt).getTime();
    return statusOf(a) === "finished" ? bt - at : at - bt;
  });
}

export function LegacyHomePage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [edgeMap, setEdgeMap] = useState<Map<string, PublicEdgeSummaryItem>>(new Map());
  const [source, setSource] = useState("");
  const [err, setErr] = useState("");
  const visible = usePageVisible();
  const { lang } = usePresent();
  const { favorites, toggleFavorite, isFavorite } = useMatchFavorites();
  const { open: agentConnectOpen } = useAgentConnectOpen();
  const t = ui(lang);

  const load = () => {
    Promise.all([fetchFixtures(), fetchEdgeSummary()])
      .then(([fixtureData, summary]) => {
        setFixtures(fixtureData.fixtures);
        setSource(fixtureData.source);
        const map = new Map<string, PublicEdgeSummaryItem>();
        for (const item of summary.items ?? []) {
          map.set(item.fixtureId, item);
        }
        setEdgeMap(map);
        setErr("");
      })
      .catch(() => setErr(t.dataUnavailable));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [visible]);

  const ordered = useMemo(
    () => sortFixtures(fixtures, edgeMap, favorites),
    [fixtures, edgeMap, favorites],
  );

  return (
    <div className="home-page">
      <section className="home-hero hero-gradient">
        <p className="home-event-kicker">{t.homeEventKicker}</p>
        <p className="home-product-kicker">{t.homeProductKicker}</p>
        <div className="home-hero-accent" aria-hidden />
        <p className="home-kicker">{t.homeKicker}</p>
        <h1>{t.homeTitle}</h1>
        <p className="home-lead">{t.homeLead}</p>
        <div className="home-hero-actions">
          <AgentConnectButton variant="hero" />
        </div>
      </section>

      <div className="home-fixtures-head">
        <h2 className="home-fixtures-title">{t.homeFixturesTitle}</h2>
      </div>
      <div className="home-grid">
        {err && <p className="match-error">{err}</p>}
        {ordered.map((f) => {
          const summary = edgeMap.get(f.fixtureId);
          const edge: PublicEdgeVerdict | undefined = summary
            ? {
                fixtureId: f.fixtureId,
                verdict: summary.verdict,
                conviction: summary.conviction,
                why:
                  summary.verdict === "SETUP"
                    ? "Independent model disagrees with market consensus."
                    : "Model agrees with market.",
                ts: new Date().toISOString(),
                direction: summary.direction,
              }
            : undefined;
          const liveFixture: Fixture = {
            ...f,
            status: summary?.status ?? f.status,
            score: summary?.score ?? f.score,
          };
          return (
            <MatchCard
              key={f.fixtureId}
              fixture={liveFixture}
              edge={edge}
              clock={summary?.clock}
              favorited={isFavorite(f.fixtureId)}
              onToggleFavorite={toggleFavorite}
            />
          );
        })}
      </div>

      {!agentConnectOpen ? (
        <p className="home-meta home-meta--foot">{t.homeSource(source || "—")}</p>
      ) : null}
    </div>
  );
}
