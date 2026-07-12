import type { PublicMatchEdge } from "@natt-pundit/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import { fetchMatchEdge } from "@/lib/api";
import { ui } from "@/lib/i18n";
import { usePageVisible } from "@/lib/usePageVisible";

const POLL_MS = 10_000;

export function useMatchEdge(fixtureId: string) {
  const visible = usePageVisible();
  const { lang } = usePresent();
  const t = ui(lang);
  const [data, setData] = useState<PublicMatchEdge | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const dataRef = useRef<PublicMatchEdge | null>(null);

  const refresh = useCallback(async () => {
    if (!fixtureId) return;
    try {
      const payload = await fetchMatchEdge(fixtureId);
      dataRef.current = payload;
      setData(payload);
      setError("");
    } catch {
      setError(dataRef.current ? "" : t.edgeUnavailable);
    } finally {
      setLoading(false);
    }
  }, [fixtureId, t.edgeUnavailable]);

  useEffect(() => {
    if (!fixtureId) return;
    setLoading(true);
    void refresh();
  }, [fixtureId, refresh]);

  useEffect(() => {
    if (!fixtureId || !visible) return;
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [fixtureId, visible, refresh]);

  return { data, error, loading, refresh };
}
