import type { Fixture, PublicEdgeSummaryItem } from "@natt-pundit/contracts";
import { useEffect, useMemo, useState } from "react";
import { fetchEdgeSummary, fetchFixtures } from "@/lib/api";
import { sortFixtures } from "@/lib/fixtureSort";
import { ui } from "@/lib/i18n";
import type { AppLang } from "@/lib/locales";
import { usePageVisible } from "@/lib/usePageVisible";

export function useFixturesWithEdge(lang: AppLang, favorites: string[] = []) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [edgeMap, setEdgeMap] = useState<Map<string, PublicEdgeSummaryItem>>(new Map());
  const [source, setSource] = useState("");
  const [err, setErr] = useState("");
  const visible = usePageVisible();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const ordered = useMemo(
    () => sortFixtures(fixtures, edgeMap, favorites),
    [fixtures, edgeMap, favorites],
  );

  return { fixtures, ordered, edgeMap, source, err, reload: load };
}
