import Link from "next/link";
import { useRouter } from "next/router";
import { EdgeBadge, EdgeDetail } from "@/components/EdgeBadge";
import { OddsTicker } from "@/components/OddsTicker";
import { SettlementProofPanel } from "@/components/SettlementProofPanel";
import { useMatchEdge } from "@/lib/useMatchEdge";

export default function MatchPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { data, error, loading } = useMatchEdge(id);

  if (!id) return null;

  return (
    <div className="match-page">
      <Link href="/" className="match-back">
        ← Fixtures
      </Link>

      {loading && !data && <p className="match-loading">Sync TxLINE…</p>}
      {error && <p className="match-error">{error}</p>}

      {data && (
        <>
          <header className="match-header glass-panel">
            <p className="match-competition">{data.fixture.competition ?? "World Cup"}</p>
            <h1 className="match-title">
              {data.fixture.homeTeam}
              <span>vs</span>
              {data.fixture.awayTeam}
            </h1>
            <p className="match-score">
              {data.fixture.score
                ? `${data.fixture.score.home} - ${data.fixture.score.away}`
                : new Date(data.fixture.kickoffAt).toLocaleString()}
            </p>
          </header>

          {data.odds.length > 0 && <OddsTicker odds={data.odds} />}

          <section className="edge-panel glass-panel">
            <div className="edge-panel-top">
              <EdgeBadge verdict={data.edge} />
            </div>
            <p className="edge-why">{data.edge.why}</p>
            <EdgeDetail verdict={data.edge} />
          </section>

          <SettlementProofPanel fixtureId={id} />
        </>
      )}
    </div>
  );
}
