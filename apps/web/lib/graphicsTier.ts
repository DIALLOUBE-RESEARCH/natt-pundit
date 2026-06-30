export type GfxTier = "low" | "mid" | "high";

export function detectGfxTier(): GfxTier {
  if (typeof window === "undefined") return "mid";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || mem < 3) return "low";
  if (mem < 6) return "mid";
  return "high";
}
