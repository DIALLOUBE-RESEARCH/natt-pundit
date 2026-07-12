"use client";

import { useEffect, useState } from "react";
import { normalizeStitchTheme, type StitchThemeMode } from "@/shared/theme/stitchTheme";

/** Live stitch theme from <html data-theme> (stitch-route / sandbox-route). */
export function useStitchThemeMode(): StitchThemeMode {
  const [mode, setMode] = useState<StitchThemeMode>("light");

  useEffect(() => {
    const read = () => normalizeStitchTheme(document.documentElement.getAttribute("data-theme"));
    setMode(read());
    const obs = new MutationObserver(() => setMode(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return mode;
}
