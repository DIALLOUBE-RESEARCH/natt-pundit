import type { NextApiRequest, NextApiResponse } from "next";
import { createExportChallenge } from "@/lib/datasExportGate";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json(createExportChallenge());
}
