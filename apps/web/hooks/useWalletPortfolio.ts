import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { fetchWalletUsdcBalance, escrowConnection } from "@/lib/nattEscrow";
import { escrowCluster } from "@/lib/escrowCluster";
import { usePageVisible } from "@/lib/usePageVisible";
import { summarizeWalletBets, type WalletBetRow, type WalletPortfolioSummary } from "@/lib/walletPortfolio";

const POLL_MS = 30_000;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type WalletBalances = {
  sol: number | null;
  usdc: number | null;
};

async function fetchWalletSolBalance(walletAddress: string): Promise<number | null> {
  try {
    const connection = escrowConnection();
    const lamports = await connection.getBalance(new PublicKey(walletAddress));
    return lamports / 1e9;
  } catch {
    return null;
  }
}

async function fetchWalletBets(walletAddress: string): Promise<{
  bets: WalletBetRow[];
  summary: WalletPortfolioSummary;
}> {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
  const res = await fetch(
    `${origin}${BASE_PATH}/api/wallet/portfolio?wallet=${encodeURIComponent(walletAddress)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("wallet_portfolio_failed");
  return res.json();
}

export function useWalletPortfolio(walletAddress: string | null | undefined) {
  const visible = usePageVisible();
  const [balances, setBalances] = useState<WalletBalances>({ sol: null, usdc: null });
  const [bets, setBets] = useState<WalletBetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const summary: WalletPortfolioSummary = useMemo(() => summarizeWalletBets(bets), [bets]);
  const cluster = escrowCluster();

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalances({ sol: null, usdc: null });
      setBets([]);
      setUpdatedAt(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [sol, usdc, portfolio] = await Promise.all([
        fetchWalletSolBalance(walletAddress),
        fetchWalletUsdcBalance(walletAddress),
        fetchWalletBets(walletAddress),
      ]);
      setBalances({ sol, usdc });
      setBets(portfolio.bets);
      setUpdatedAt(new Date());
    } catch {
      setError("sync_failed");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!walletAddress || !visible) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [walletAddress, visible, refresh]);

  return {
    balances,
    bets,
    summary,
    loading,
    error,
    updatedAt,
    cluster,
    refresh,
  };
}
