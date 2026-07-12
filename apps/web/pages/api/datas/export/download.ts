import type { NextApiRequest, NextApiResponse } from "next";
import { internalExportSecret, verifyExportDownloadToken } from "@/lib/datasExportGate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(400).json({ error: "token_required" });
    return;
  }

  const checked = verifyExportDownloadToken(token);
  if (!checked.ok) {
    res.status(403).json({ error: checked.reason });
    return;
  }

  const internalSecret = internalExportSecret();
  if (!internalSecret) {
    res.status(503).json({ error: "export_not_configured" });
    return;
  }

  const edgeBase =
    process.env.PUNDIT_EDGE_URL?.trim() || process.env.NEXT_PUBLIC_EDGE_API_URL?.trim() || "";
  if (!edgeBase) {
    res.status(503).json({ error: "edge_url_missing" });
    return;
  }

  const upstream = `${edgeBase.replace(/\/$/, "")}/v1/data/export`;
  const zipRes = await fetch(upstream, {
    headers: { "X-Datas-Export-Internal": internalSecret },
  });

  if (!zipRes.ok) {
    res.status(zipRes.status === 403 ? 503 : 502).json({ error: "zip_upstream_failed" });
    return;
  }

  const buf = Buffer.from(await zipRes.arrayBuffer());
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="natt-pundit-dataset.zip"');
  res.status(200).send(buf);
}
