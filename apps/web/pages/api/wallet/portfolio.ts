import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeSolanaAddress } from "@/lib/solanaAddress";
import { summarizeWalletBets } from "@/lib/walletPortfolio";
import { scanWalletPortfolioOnChain, fetchWalletOnChainBalances } from "@/lib/walletOnChainScan";

export type WalletPortfolioJson = {
  bets: Awaited<ReturnType<typeof scanWalletPortfolioOnChain>>["bets"];
  summary: Awaited<ReturnType<typeof scanWalletPortfolioOnChain>>["summary"];
  sol: number;
  usdc: number | null;
};

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

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const empty = { bets: [] as WalletPortfolioJson["bets"], summary: summarizeWalletBets([]) };
  let payload: Pick<WalletPortfolioJson, "bets" | "summary"> = empty;
  let balances = { sol: 0, usdc: null as number | null };

  try {
    balances = await fetchWalletOnChainBalances(wallet);
  } catch (err) {
    res.status(502).json({
      error: "wallet_balances_failed",
      message: err instanceof Error ? err.message : "unknown",
    });
    return;
  }

  try {
    payload = await scanWalletPortfolioOnChain(wallet);
  } catch {
    /* balances still returned — scan can fail without blocking SOL/USDC */
  }

  res.status(200).json({
    ...payload,
    sol: balances.sol,
    usdc: balances.usdc,
  } satisfies WalletPortfolioJson);
}
