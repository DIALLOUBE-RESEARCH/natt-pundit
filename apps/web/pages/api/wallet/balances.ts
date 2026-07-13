import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { fetchWalletOnChainBalances } from "@/lib/walletOnChainScan";
import { normalizeSolanaAddress } from "@/lib/solanaAddress";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const raw = typeof req.query.wallet === "string" ? req.query.wallet.trim() : "";
  const wallet = normalizeSolanaAddress(raw);
  if (!wallet) {
    res.status(400).json({ error: raw ? "wallet_invalid" : "wallet_required" });
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
    const balances = await fetchWalletOnChainBalances(wallet);
    res.status(200).json(balances);
  } catch (err) {
    res.status(502).json({
      error: "wallet_balances_failed",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
