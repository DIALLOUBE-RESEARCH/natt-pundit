"use client";

import { useAppKit } from "@reown/appkit/react";
import { usePresent } from "@/components/present/PresentProvider";
import { ensureNattPunditAppKit, openNattPunditWalletModal } from "@/lib/nattPunditAppKit";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import { shell } from "@/lib/appShellI18n";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function WalletConnectButtonInner() {
  const { open } = useAppKit();
  const { address, isConnected } = useSolanaConnectedWallet();
  const { lang } = usePresent();
  const s = shell(lang);

  return (
    <button
      type="button"
      className="wallet-connect-btn"
      onClick={() => {
        ensureNattPunditAppKit();
        openNattPunditWalletModal(open, isConnected);
      }}
    >
      {isConnected && address ? shortAddr(address) : s.walletLabel}
    </button>
  );
}

export function WalletConnectButton() {
  const hasProjectId = Boolean(process.env.NEXT_PUBLIC_PROJECT_ID);
  const { lang } = usePresent();
  const s = shell(lang);

  if (!hasProjectId) {
    return (
      <span className="wallet-connect-btn wallet-connect-btn--disabled" title={s.walletDisabledTitle}>
        {s.walletLabel}
      </span>
    );
  }

  return <WalletConnectButtonInner />;
}
