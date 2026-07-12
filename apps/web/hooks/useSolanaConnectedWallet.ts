"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import { PublicKey, Connection, type Transaction } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { usePhantomMobileContext } from "@/context/PhantomMobileProvider";
import { escrowConnection } from "@/lib/nattEscrow";
import { isPhantomInAppBrowser } from "@/lib/mobileBrowser";
import { phantomMobileConnectedWallet } from "@/lib/phantomMobileDeeplink";
import type { ConnectedWallet } from "@/lib/solanaWallet";
import { buildLegacyInjectedWallet, connectSolanaWallet, listAvailableWallets } from "@/lib/solanaWallet";

/**
 * AppKit (Reown) wallet when connected; Phantom mobile deeplink session after approve+return.
 */
export function useSolanaConnectedWallet(): {
  wallet: ConnectedWallet | null;
  address: string | null;
  isConnected: boolean;
  isAppKit: boolean;
  isPhantomMobile: boolean;
  hasProjectId: boolean;
} {
  const hasProjectId = Boolean(process.env.NEXT_PUBLIC_PROJECT_ID);
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount({
    namespace: "solana",
  });
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const { connection } = useAppKitConnection();
  const phantom = usePhantomMobileContext();

  const appKitWallet = useMemo((): ConnectedWallet | null => {
    if (!appKitConnected || !appKitAddress || !walletProvider || !connection) return null;
    return {
      name: "Wallet",
      address: appKitAddress,
      signMessage: async (message: Uint8Array) => {
        const sig = await walletProvider.signMessage(message);
        return sig instanceof Uint8Array ? sig : new Uint8Array(sig);
      },
      signAndSendTransaction: async (tx: Transaction, connOverride?: Connection) => {
        const conn = connOverride ?? connection;
        const { blockhash } = await conn.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = new PublicKey(appKitAddress);
        return walletProvider.sendTransaction(tx, conn);
      },
    };
  }, [appKitAddress, connection, appKitConnected, walletProvider]);

  const phantomWallet = useMemo((): ConnectedWallet | null => {
    if (!phantom.session) return null;
    return phantomMobileConnectedWallet(phantom.session, escrowConnection());
  }, [phantom.session]);

  const [legacyInjectedWallet, setLegacyInjectedWallet] = useState<ConnectedWallet | null>(null);
  useEffect(() => {
    if (!isPhantomInAppBrowser()) {
      setLegacyInjectedWallet(null);
      return;
    }
    const refresh = () => setLegacyInjectedWallet(buildLegacyInjectedWallet());
    refresh();
    const w = window as Window & {
      solana?: { on?: (event: string, cb: () => void) => void; off?: (event: string, cb: () => void) => void };
    };
    w.solana?.on?.("connect", refresh);
    w.solana?.on?.("accountChanged", refresh);
    return () => {
      w.solana?.off?.("connect", refresh);
      w.solana?.off?.("accountChanged", refresh);
    };
  }, []);

  const wallet = phantomWallet ?? legacyInjectedWallet ?? appKitWallet;
  const address = phantom.address ?? legacyInjectedWallet?.address ?? appKitAddress;
  const isConnected = Boolean(wallet && address);

  return {
    wallet,
    address: address ?? null,
    isConnected,
    isAppKit: Boolean(appKitWallet && wallet === appKitWallet),
    isPhantomMobile: Boolean(phantomWallet && wallet === phantomWallet),
    hasProjectId,
  };
}

/** Imperative legacy connect when AppKit project id is absent (local dev). */
export async function connectLegacyWallet(): Promise<ConnectedWallet> {
  const wallets = listAvailableWallets();
  const id = wallets[0]?.id;
  if (!id) {
    throw new Error("No Solana wallet detected. Install Phantom or use Reown AppKit.");
  }
  return connectSolanaWallet(id);
}
