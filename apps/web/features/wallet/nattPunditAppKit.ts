"use client";

import { createAppKit, type AppKit } from "@reown/appkit/react";
import type { CaipAddress, ChainNamespace } from "@reown/appkit-common";
import { appKitMetadata, defaultSolanaNetwork, projectId, solanaAdapter, solanaNetworks } from "@/config/wallet";
import { isMobileExternalBrowser } from "@/lib/mobileBrowser";
import {
  clearPhantomMobileSession,
  loadPhantomMobileSession,
  PHANTOM_WALLET_REOWN_ID,
  type PhantomMobileSession,
} from "@/lib/phantomMobileDeeplink";
import {
  getStitchAppKitThemeMode,
  getStitchAppKitThemeVariables,
  getStitchAppKitThemeVariablesForMode,
  type StitchThemeMode,
} from "@/shared/theme/stitchTheme";

let appKitReady = false;
let appKitModal: AppKit | undefined;
let phantomDisconnectBridgeReady = false;

const PHANTOM_MOBILE_WALLET_TYPE = "PHANTOM_MOBILE";

/** Custom Phantom row in Reown modal (mobile) — real connect via deeplink intercept, not browse. */
export const NATT_PHANTOM_CUSTOM_WALLET_ID = "natt-phantom-ul-connect";

function currentDappUrl(): string {
  if (typeof window === "undefined") return appKitMetadata.url;
  return window.location.href.split("#")[0] ?? window.location.href;
}

/** WC / Phantom mobile return should target the page where connect started. */
export function syncNattPunditAppKitMetadata(): void {
  if (typeof window === "undefined") return;
  const url = currentDappUrl();
  sessionStorage.setItem("nattpundit.dapp_return_url", url);
  (appKitMetadata as { url: string }).url = url;
}

/** Mirror Phantom mobile deeplink session into AppKit so Account view shows Disconnect. */
export function syncPhantomMobileSessionToAppKit(session: PhantomMobileSession): void {
  if (!appKitModal) return;
  const caipAddress = `solana:${defaultSolanaNetwork.id}:${session.publicKey}` as CaipAddress;
  appKitModal.setCaipAddress(caipAddress, "solana");
  appKitModal.setStatus("connected", "solana");
  appKitModal.setConnectedWalletInfo(
    {
      name: "Phantom",
      icon: "https://phantom.app/favicon.ico",
      type: PHANTOM_MOBILE_WALLET_TYPE,
    },
    "solana",
  );
}

/** Clear Phantom + AppKit (programmatic disconnect). */
export async function disconnectNattPunditWallet(): Promise<void> {
  clearPhantomMobileSession();
  await getNattPunditAppKitModal()?.disconnect("solana");
  window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
}

function ensurePhantomAppKitDisconnectBridge(): void {
  if (phantomDisconnectBridgeReady || !appKitModal) return;
  phantomDisconnectBridgeReady = true;

  // User tapped Disconnect in Reown Account view.
  appKitModal.subscribeEvents((events) => {
    const payload = events.data;
    if (payload?.type !== "track" || payload.event !== "DISCONNECT_SUCCESS") return;
    if (loadPhantomMobileSession()) {
      clearPhantomMobileSession();
      window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
    }
  });

  // AppKit may drop our mirrored Phantom state (no real connector). Re-sync only while modal open.
  appKitModal.subscribeAccount((acc) => {
    const session = loadPhantomMobileSession();
    if (!session || acc?.isConnected) return;
    if (appKitModal?.isOpen()) {
      syncPhantomMobileSessionToAppKit(session);
    }
  }, "solana");
}

/** Open Reown modal — Account + Disconnect when Phantom mobile session is active. */
export function openNattPunditWalletModal(
  open: (options: { view: "Account" | "Connect"; namespace: ChainNamespace }) => void,
  isConnected: boolean,
): void {
  ensureNattPunditAppKit();
  syncNattPunditAppKitMetadata();
  const session = loadPhantomMobileSession();
  if (session) {
    syncPhantomMobileSessionToAppKit(session);
  }
  open({ view: isConnected ? "Account" : "Connect", namespace: "solana" });
}

/** Push stitch theme into Reown modal (must use modal API — ThemeController alone skips setColorTheme). */
export function syncNattPunditAppKitTheme(mode: StitchThemeMode): void {
  if (!appKitModal) return;
  appKitModal.setThemeMode(mode);
  appKitModal.setThemeVariables(getStitchAppKitThemeVariablesForMode(mode));
}

/** Init Reown once. */
export function ensureNattPunditAppKit(): boolean {
  if (appKitReady || typeof window === "undefined") return appKitReady;
  if (!projectId) {
    console.warn("NEXT_PUBLIC_PROJECT_ID missing — Reown wallet modal disabled.");
    return false;
  }
  const themeMode = getStitchAppKitThemeMode();
  const mobileExternal = isMobileExternalBrowser();

  appKitModal = createAppKit({
    adapters: [solanaAdapter],
    networks: solanaNetworks,
    projectId,
    metadata: appKitMetadata,
    defaultNetwork: defaultSolanaNetwork,
    enableReconnect: true,
    enableWalletGuide: false,
    themeMode,
    ...(mobileExternal
      ? {
          excludeWalletIds: [PHANTOM_WALLET_REOWN_ID],
          featuredWalletIds: [NATT_PHANTOM_CUSTOM_WALLET_ID],
          customWallets: [
            {
              id: NATT_PHANTOM_CUSTOM_WALLET_ID,
              name: "Phantom",
              homepage: "https://phantom.app",
              image_url: "https://phantom.app/favicon.ico",
            },
          ],
        }
      : {}),
    features: {
      analytics: false,
      email: false,
      socials: false,
      onramp: false,
      swaps: false,
    },
    themeVariables: getStitchAppKitThemeVariables(),
  });
  syncNattPunditAppKitTheme(themeMode);
  syncNattPunditAppKitMetadata();
  ensurePhantomAppKitDisconnectBridge();
  const session = loadPhantomMobileSession();
  if (session) {
    syncPhantomMobileSessionToAppKit(session);
  }
  appKitReady = true;
  return true;
}

export function getNattPunditAppKitModal(): AppKit | undefined {
  return appKitModal;
}
