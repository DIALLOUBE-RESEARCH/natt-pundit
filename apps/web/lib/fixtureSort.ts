import type { Fixture, PublicEdgeSummaryItem } from "@natt-pundit/contracts";

/**
 * Matches board order (stable — SETUP does not reshuffle):
 * favorites → live → scheduled (kickoff asc, soonest first) → finished last (kickoff desc).
 */
export function sortFixtures(
  fixtures: Fixture[],
  edges: Map<string, PublicEdgeSummaryItem>,
  favorites: string[] = [],
): Fixture[] {
  const favOrder = new Map(favorites.map((id, i) => [id, i]));

  const statusOf = (f: Fixture): Fixture["status"] => resolveFixtureStatus(f, edges);

  const rank = (f: Fixture) => {
    const status = statusOf(f);
    if (status === "live") return 0;
    if (status === "scheduled") return 1;
    return 2;
  };

  const kickoffMs = (f: Fixture) => new Date(f.kickoffAt).getTime();

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

    const at = kickoffMs(a);
    const bt = kickoffMs(b);
    if (statusOf(a) === "finished") return bt - at;
    return at - bt;
  });
}

export function resolveFixtureStatus(
  f: Fixture,
  edges: Map<string, PublicEdgeSummaryItem>,
): Fixture["status"] {
  const edgeStatus = edges.get(f.fixtureId)?.status;
  if (edgeStatus === "live" || f.status === "live") return "live";
  return f.status;
}

/** Live first, else soonest scheduled, else most recent finished. */
export function pickFeaturedFixture(
  fixtures: Fixture[],
  edges: Map<string, PublicEdgeSummaryItem>,
): Fixture | null {
  const ordered = sortFixtures(fixtures, edges);
  const live = ordered.find((f) => resolveFixtureStatus(f, edges) === "live");
  if (live) return live;
  const scheduled = ordered.find((f) => resolveFixtureStatus(f, edges) === "scheduled");
  if (scheduled) return scheduled;
  const finished = ordered.filter((f) => resolveFixtureStatus(f, edges) === "finished");
  return finished[0] ?? null;
}

export function featuredSectionLabel(
  fixture: Fixture,
  edges: Map<string, PublicEdgeSummaryItem>,
  labels: { live: string; upcoming: string; finished: string },
): string {
  const status = resolveFixtureStatus(fixture, edges);
  if (status === "live") return labels.live;
  if (status === "scheduled") return labels.upcoming;
  return labels.finished;
}
