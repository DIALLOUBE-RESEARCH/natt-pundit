import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { scanWalletPortfolioOnChain } from "@/lib/walletOnChainScan";

export type WalletPortfolioJson = {
  bets: Awaited<ReturnType<typeof scanWalletPortfolioOnChain>>["bets"];
  summary: Awaited<ReturnType<typeof scanWalletPortfolioOnChain>>["summary"];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const wallet = typeof req.query.wallet === "string" ? req.query.wallet.trim() : "";
  if (!wallet) {
    res.status(400).json({ error: "wallet_required" });
    return;
  }

  try {
    new PublicKey(wallet);
  } catch {
    res.status(400).json({ error: "wallet_invalid" });
    return;
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const payload = await scanWalletPortfolioOnChain(wallet);
    res.status(200).json(payload satisfies WalletPortfolioJson);
  } catch (err) {
    res.status(502).json({
      error: "wallet_portfolio_failed",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
