import type { NextApiRequest, NextApiResponse } from "next";
import { isAllowedFlagIso, normalizeFlagWidth } from "@/lib/countryFlags";

/**
 * Cached same-origin flag proxy (flagcdn upstream).
 * Stops desktop grids from hammering third-party CDNs and leaving empty flag circles.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const rawIso = String(req.query.iso ?? "").toLowerCase();
  if (!isAllowedFlagIso(rawIso)) {
    res.status(404).json({ error: "flag_not_found" });
    return;
  }

  const width = normalizeFlagWidth(Number(req.query.w) || 80);
  const upstream = `https://flagcdn.com/w${width}/${rawIso}.png`;

  try {
    const upstreamRes = await fetch(upstream, {
      headers: { Accept: "image/png,image/*" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstreamRes.ok) {
      res.status(502).json({ error: "upstream_flag_unavailable" });
      return;
    }
    const body = Buffer.from(await upstreamRes.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    res.status(200).send(body);
  } catch {
    res.status(502).json({ error: "upstream_flag_fetch_failed" });
  }
}
