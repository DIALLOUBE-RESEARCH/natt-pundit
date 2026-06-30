import type { MatchEdge } from "@natt-pundit/contracts";
import { useCallback, useEffect, useState } from "react";
import { fetchMatchEdge } from "@/lib/api";
import { usePageVisible } from "@/lib/usePageVisible";

const POLL_MS = 10_000;

export function useMatchEdge(fixtureId: string) {
  const visible = usePageVisible();
  const [data, setData] = useState<MatchEdge | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!fixtureId) return;
    try {
      const payload = await fetchMatchEdge(fixtureId);
      setData(payload);
      setError("");
    } catch {
      setError("Edge indisponible");
    } finally {
      setLoading(false);
    }
  }, [fixtureId]);

  useEffect(() => {
    if (!fixtureId) return;
    setLoading(true);
    refresh();
  }, [fixtureId, refresh]);

  useEffect(() => {
    if (!fixtureId || !visible) return;
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [fixtureId, visible, refresh]);

  return { data, error, loading, refresh };
}
