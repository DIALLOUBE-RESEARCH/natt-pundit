"use client";

import { useEffect, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { walletCopy } from "@/lib/walletI18n";
import type { WalletBetRow } from "@/lib/walletPortfolio";
import { consumePhantomSignResult } from "@/lib/phantomMobileDeeplink";
import {
  runWalletBetEscrow,
  walletBetEscrowAction,
  type WalletBetEscrowAction as EscrowAction,
} from "@/lib/walletBetEscrow";

type Props = {
  bet: WalletBetRow;
  onDone: () => void;
};

function actionLabel(action: EscrowAction, c: ReturnType<typeof walletCopy>): string {
  if (action === "collect") return c.actionCollect;
  return c.actionRefund;
}

export function WalletBetEscrowAction({ bet, onDone }: Props) {
  const { lang } = usePresent();
  const c = walletCopy(lang);
  const { wallet } = useSolanaConnectedWallet();
  const action = walletBetEscrowAction(bet);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshAfterSign = () => {
      setBusy(false);
      setError("");
      onDone();
      window.setTimeout(() => onDone(), 1500);
      window.setTimeout(() => onDone(), 4000);
    };
    const onPhantomSign = (ev: Event) => {
      const detail = (ev as CustomEvent<{ signature: string; fixtureId: string }>).detail;
      if (!detail?.signature || detail.fixtureId !== bet.fixtureId) return;
      refreshAfterSign();
    };
    const stashed = consumePhantomSignResult();
    if (stashed?.signature && stashed.fixtureId === bet.fixtureId) {
      refreshAfterSign();
    }
    window.addEventListener("phantom-sign-complete", onPhantomSign);
    return () => window.removeEventListener("phantom-sign-complete", onPhantomSign);
  }, [bet.fixtureId, onDone]);

  if (!action || !wallet) return null;

  async function onClick() {
    if (!wallet || !action) return;
    setError("");
    setBusy(true);
    let phantomRedirect = false;
    try {
      await runWalletBetEscrow(wallet, bet, action);
      onDone();
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "phantom_mobile_redirect") {
        phantomRedirect = true;
        return;
      }
      const raw = e instanceof Error ? e.message : "action_failed";
      setError(raw);
    } finally {
      if (!phantomRedirect) setBusy(false);
    }
  }

  return (
    <div className="stitch-wallet-activity-actions">
      <button
        type="button"
        className="stitch-wallet-action-btn"
        disabled={busy}
        onClick={() => void onClick()}
      >
        {busy ? c.actionWorking : actionLabel(action, c)}
      </button>
      {error ? <span className="stitch-wallet-action-error">{error}</span> : null}
    </div>
  );
}
