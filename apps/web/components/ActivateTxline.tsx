"use client";

import { useCallback, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { ensureNattPunditAppKit } from "@/lib/nattPunditAppKit";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { usePresent } from "@/components/present/PresentProvider";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { ActivateTxlineForm } from "@/components/ActivateTxlineForm";
import { connectLegacyWallet } from "@/hooks/useSolanaConnectedWallet";
import { shell } from "@/lib/appShellI18n";
import type { ConnectedWallet } from "@/lib/solanaWallet";

function ActivateTxlineAppKit() {
  const { wallet } = useSolanaConnectedWallet();
  const { open } = useAppKit();
  const { lang } = usePresent();
  const s = shell(lang);

  return (
    <ActivateTxlineForm
      connected={wallet}
      walletSlot={
        <div className="activate-wallet-row">
          <WalletConnectButton />
          {!wallet ? (
            <button
              type="button"
              className="text-xs text-natt-gold underline"
              onClick={() => {
                ensureNattPunditAppKit();
                open({ view: "Connect", namespace: "solana" });
              }}
            >
              {s.openWalletPicker}
            </button>
          ) : null}
          <p className="text-xs text-white/50">{s.walletStackHint}</p>
        </div>
      }
    />
  );
}

function ActivateTxlineLegacy() {
  const [legacyWallet, setLegacyWallet] = useState<ConnectedWallet | null>(null);
  const [busy, setBusy] = useState(false);
  const [connectErr, setConnectErr] = useState("");
  const { lang } = usePresent();
  const s = shell(lang);

  const connectLegacy = useCallback(async () => {
    setBusy(true);
    setConnectErr("");
    try {
      setLegacyWallet(await connectLegacyWallet());
    } catch (e) {
      setConnectErr(e instanceof Error ? e.message : s.connectWalletFirst);
    } finally {
      setBusy(false);
    }
  }, [s.connectWalletFirst]);

  return (
    <ActivateTxlineForm
      connected={legacyWallet}
      walletSlot={
        <div className="activate-wallet-row">
          <button type="button" disabled={busy} onClick={connectLegacy} className="wallet-connect-btn">
            {busy
              ? s.connecting
              : legacyWallet
                ? `${legacyWallet.address.slice(0, 8)}…`
                : s.connectSolanaWallet}
          </button>
          {connectErr ? <p className="text-sm text-red-400">{connectErr}</p> : null}
          <p className="text-xs text-amber-300">{s.walletProjectIdHint}</p>
        </div>
      }
    />
  );
}

export function ActivateTxline() {
  const hasProjectId = Boolean(process.env.NEXT_PUBLIC_PROJECT_ID);
  return hasProjectId ? <ActivateTxlineAppKit /> : <ActivateTxlineLegacy />;
}
