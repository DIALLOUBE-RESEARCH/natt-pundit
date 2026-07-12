import type { Fixture } from "@natt-pundit/contracts";

function kickoffMs(f: Fixture): number {
  const t = new Date(f.kickoffAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Union rolling-visible fixtures with the permanent archive.
 * Visible entries win on id conflict (fresher TxLINE / store metadata).
 */
export function mergeVisibleWithArchive(visible: Fixture[], archived: Fixture[]): Fixture[] {
  const byId = new Map<string, Fixture>();
  for (const f of archived) byId.set(f.fixtureId, f);
  for (const f of visible) byId.set(f.fixtureId, f);
  return [...byId.values()].sort((a, b) => kickoffMs(a) - kickoffMs(b));
}
