/** Runtime-safe base path for same-origin API fetches (PWA / stale env fallback). */
export function clientBasePath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/^(\/[^/]+\/nattpundit)/);
    if (match?.[1]) return match[1];
  }
  return "/fr/nattpundit";
}
