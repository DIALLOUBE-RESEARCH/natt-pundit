import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";

export type AgentProfileJson = {
  wallet: string;
  label: string;
  mcpUrl: string;
};

/**
 * F94N — Public identity of the demo autonomous agent (read-only).
 * Wallet comes from server env so it can be rotated without rebuild.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const wallet = process.env.NATT_PUNDIT_DEMO_AGENT_WALLET?.trim() ?? "";
  if (!wallet) {
    res.status(404).json({ error: "agent_wallet_not_configured" });
    return;
  }

  try {
    new PublicKey(wallet);
  } catch {
    res.status(500).json({ error: "agent_wallet_invalid" });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).json({
    wallet,
    label: process.env.NATT_PUNDIT_DEMO_AGENT_LABEL?.trim() || "Natt Agent",
    mcpUrl:
      process.env.NEXT_PUBLIC_NATT_PUNDIT_MCP_URL?.trim() ||
      "https://hypernatt.com/mcp-pundit/protocol",
  } satisfies AgentProfileJson);
}
