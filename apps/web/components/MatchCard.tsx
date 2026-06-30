import type { Fixture, EdgeVerdict } from "@natt-pundit/contracts";
import Link from "next/link";
import { EdgeBadge } from "@/components/EdgeBadge";
import { TeamShield } from "@/components/TeamShield";
import { teamPalette } from "@/lib/teamColors";

type Props = { fixture: Fixture; featured?: boolean; edge?: EdgeVerdict };

export function MatchCard({ fixture, featured, edge }: Props) {
  const live = fixture.status === "live";
  return (
    <Link
      href={`/match/${fixture.fixtureId}`}
      className={featured ? "match-card-link featured" : "match-card-link"}
    >
      <article className={`match-card glass-panel ${live ? "glass-panel-live" : ""}`}>
        <div className="match-card-top">
          <span>{fixture.competition ?? "World Cup"}</span>
          <span className="match-card-top-right">
            {edge ? <EdgeBadge verdict={edge} /> : null}
            <span>{fixture.status.toUpperCase()}</span>
          </span>
        </div>
        <div className="match-card-teams">
          <TeamShield team={fixture.homeTeam} palette={teamPalette(fixture.homeTeam)} size="sm" />
          <div className="match-card-score">
            <p className="match-card-names">
              {fixture.homeTeam}
              <span className="vs">vs</span>
              {fixture.awayTeam}
            </p>
            <p className="match-card-result">
              {fixture.score ? `${fixture.score.home} - ${fixture.score.away}` : "—"}
            </p>
          </div>
          <TeamShield team={fixture.awayTeam} palette={teamPalette(fixture.awayTeam)} size="sm" />
        </div>
        <p className="match-card-foot">
          {live ? <strong className="live-tag">LIVE</strong> : fixture.status}
          <span>·</span>
          {new Date(fixture.kickoffAt).toLocaleString()}
        </p>
      </article>
    </Link>
  );
}
