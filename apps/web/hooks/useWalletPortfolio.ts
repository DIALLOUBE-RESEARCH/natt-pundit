import { useCallback, useEffect, useMemo, useState } from "react";
import { usePageVisible } from "@/lib/usePageVisible";
import { clientBasePath } from "@/lib/clientBasePath";
import { normalizeSolanaAddress } from "@/lib/solanaAddress";
import { summarizeWalletBets, type WalletBetRow, type WalletPortfolioSummary } from "@/lib/walletPortfolio";
import { escrowCluster } from "@/lib/escrowCluster";

const POLL_MS = 30_000;

export type WalletBalances = {
  sol: number | null;
  usdc: number | null;
};

type WalletPortfolioResponse = {
  bets: WalletBetRow[];
  summary: WalletPortfolioSummary;
  sol?: number;
  usdc?: number | null;
};

function apiOrigin(): string {
  return typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000");
}

async function fetchWalletBalances(walletAddress: string): Promise<WalletBalances> {
  const res = await fetch(
    `${apiOrigin()}${clientBasePath()}/api/wallet/balances?wallet=${encodeURIComponent(walletAddress)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("wallet_balances_failed");
  const json = (await res.json()) as { sol: number; usdc: number | null };
  return { sol: json.sol, usdc: json.usdc };
}

async function fetchWalletPortfolioBets(walletAddress: string): Promise<WalletBetRow[]> {
  const res = await fetch(
    `${apiOrigin()}${clientBasePath()}/api/wallet/portfolio?wallet=${encodeURIComponent(walletAddress)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("wallet_portfolio_failed");
  const json = (await res.json()) as WalletPortfolioResponse;
  return json.bets;
}

export function useWalletPortfolio(walletAddress: string | null | undefined) {
  const visible = usePageVisible();
  const normalizedWallet = useMemo(() => normalizeSolanaAddress(walletAddress), [walletAddress]);
  const [balances, setBalances] = useState<WalletBalances>({ sol: null, usdc: null });
  const [bets, setBets] = useState<WalletBetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const summary: WalletPortfolioSummary = useMemo(() => summarizeWalletBets(bets), [bets]);
  const cluster = escrowCluster();

  const refresh = useCallback(async () => {
    if (!normalizedWallet) {
      setBalances({ sol: null, usdc: null });
      setBets([]);
      setUpdatedAt(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    const [balancesResult, betsResult] = await Promise.allSettled([
      fetchWalletBalances(normalizedWallet),
      fetchWalletPortfolioBets(normalizedWallet),
    ]);

    if (balancesResult.status === "fulfilled") {
      setBalances(balancesResult.value);
    }

    if (betsResult.status === "fulfilled") {
      setBets(betsResult.value);
      setUpdatedAt(new Date());
    }

    if (balancesResult.status === "rejected" && betsResult.status === "rejected") {
      setError("sync_failed");
    } else {
      setError("");
    }

    setLoading(false);
  }, [normalizedWallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!normalizedWallet || !visible) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [normalizedWallet, visible, refresh]);

  useEffect(() => {
    const onWalletSession = () => void refresh();
    window.addEventListener("phantom-connect-complete", onWalletSession);
    return () => window.removeEventListener("phantom-connect-complete", onWalletSession);
  }, [refresh]);

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
