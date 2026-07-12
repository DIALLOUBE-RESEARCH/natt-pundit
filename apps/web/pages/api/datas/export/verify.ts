import type { NextApiRequest, NextApiResponse } from "next";
import { mintExportDownloadToken, verifySiwsExportSignature } from "@/lib/datasExportGate";

type Body = {
  pubkey?: string;
  message?: string;
  signature?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = (req.body ?? {}) as Body;
  const pubkey = typeof body.pubkey === "string" ? body.pubkey.trim() : "";
  const message = typeof body.message === "string" ? body.message : "";
  const signature = typeof body.signature === "string" ? body.signature.trim() : "";

  if (!pubkey || !message || !signature) {
    res.status(400).json({ error: "missing_fields" });
    return;
  }

  const verified = verifySiwsExportSignature({ message, signatureBase58: signature, pubkey });
  if (!verified.ok) {
    res.status(403).json({ error: verified.reason });
    return;
  }

  try {
    const token = mintExportDownloadToken({ pubkey: verified.pubkey, nonce: verified.nonce });
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    res.status(200).json({
      downloadUrl: `${basePath}/api/datas/export/download?token=${encodeURIComponent(token)}`,
      expiresInSec: 120,
    });
  } catch {
    res.status(503).json({ error: "export_not_configured" });
  }
}
