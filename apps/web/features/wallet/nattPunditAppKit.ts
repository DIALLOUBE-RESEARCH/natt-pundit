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
import { clientBasePath } from "@/lib/clientBasePath";
import { ConnectorController } from "@reown/appkit-controllers";
import { formatSolBalance } from "@/lib/formatSolBalance";
import { phantomWalletIconForAppKit } from "@/lib/phantomWalletIcon";
import { normalizeSolanaAddress } from "@/lib/solanaAddress";

/** Same-origin SVG for connect list; Account address chip uses active connector image. */
export function phantomWalletIconUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${clientBasePath()}/ui/wallets/phantom.svg`;
  }
  return `https://hypernatt.com${clientBasePath()}/ui/wallets/phantom.svg`;
}

const PHANTOM_MOBILE_WALLET_TYPE = "PHANTOM_MOBILE";

/** Reown Account: pink sphere = wui-avatar address; chip icon = active connector image. */
function ensurePhantomMobileConnectorRegistered(): void {
  if (!appKitModal || !isMobileExternalBrowser()) return;
  if (ConnectorController.getConnectorById(NATT_PHANTOM_CUSTOM_WALLET_ID)) return;

  const iconUrl = phantomWalletIconUrl();
  const iconDataUri = phantomWalletIconForAppKit();
  appKitModal.addConnector({
    id: NATT_PHANTOM_CUSTOM_WALLET_ID,
    type: "EXTERNAL",
    name: "Phantom",
    imageUrl: iconUrl,
    explorerId: PHANTOM_WALLET_REOWN_ID,
    chain: "solana",
    info: {
      name: "Phantom",
      icon: iconDataUri,
    },
  });
}

function activatePhantomMobileConnector(): void {
  if (!isMobileExternalBrowser()) return;
  ensurePhantomMobileConnectorRegistered();
  ConnectorController.setConnectorId(NATT_PHANTOM_CUSTOM_WALLET_ID, "solana");
}

function deactivatePhantomMobileConnector(): void {
  if (!isMobileExternalBrowser()) return;
  if (ConnectorController.getConnectorId("solana") === NATT_PHANTOM_CUSTOM_WALLET_ID) {
    ConnectorController.removeConnectorId("solana");
  }
}

function applyPhantomWalletVisualsToAppKit(): void {
  if (!appKitModal) return;
  // Desktop-like: generated address avatar (pink sphere), not profileImage override.
  appKitModal.setProfileImage(null, "solana");
  activatePhantomMobileConnector();
  const icon = phantomWalletIconUrl();
  appKitModal.setConnectedWalletInfo(
    {
      name: "Phantom",
      icon,
      type: PHANTOM_MOBILE_WALLET_TYPE,
    },
    "solana",
  );
}

async function fetchPhantomMobileSolBalance(publicKey: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const wallet = normalizeSolanaAddress(publicKey);
  if (!wallet) return null;
  try {
    const res = await fetch(
      `${window.location.origin}${clientBasePath()}/api/wallet/balances?wallet=${encodeURIComponent(wallet)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { sol?: number };
    if (typeof json.sol !== "number" || Number.isNaN(json.sol)) return null;
    return formatSolBalance(json.sol);
  } catch {
    return null;
  }
}

export async function syncPhantomMobileBalanceToAppKit(publicKey: string): Promise<void> {
  if (!appKitModal) return;
  const formatted = await fetchPhantomMobileSolBalance(publicKey);
  if (formatted !== null) {
    appKitModal.setBalance(formatted, "SOL", "solana");
  }
}

const ACCOUNT_SYNC_DELAYS_MS = [0, 120, 400, 900, 1800];

let accountUiPushGeneration = 0;
let modalOpenEdge = false;

function beginPhantomAccountUiPush(): number {
  accountUiPushGeneration += 1;
  return accountUiPushGeneration;
}

function cancelPhantomAccountUiPush(): void {
  accountUiPushGeneration += 1;
}

/** Re-apply avatar + SOL after Account view paints (no AppKit state subscription — avoids freeze). */
export async function pushPhantomBalanceAfterModalOpen(
  publicKey: string,
  generation = beginPhantomAccountUiPush(),
): Promise<void> {
  for (const delay of ACCOUNT_SYNC_DELAYS_MS) {
    if (generation !== accountUiPushGeneration) return;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (generation !== accountUiPushGeneration) return;
    if (!appKitModal?.isOpen()) return;
    applyPhantomWalletVisualsToAppKit();
    await syncPhantomMobileBalanceToAppKit(publicKey);
  }
}

let appKitReady = false;
let appKitModal: AppKit | undefined;
let phantomDisconnectBridgeReady = false;

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
  appKitModal.setCaipAddress(caipAddress, "solana", false);
  appKitModal.setStatus("connected", "solana");
  applyPhantomWalletVisualsToAppKit();
  void syncPhantomMobileBalanceToAppKit(session.publicKey);
}

/** Clear mirrored AppKit account without WC disconnect (phantom mobile has no real connector session). */
export async function resetPhantomMirroredAppKitAccount(): Promise<void> {
  if (!appKitModal) return;
  deactivatePhantomMobileConnector();
  appKitModal.setCaipAddress(null, "solana");
  appKitModal.setStatus("disconnected", "solana");
  appKitModal.resetAccount("solana");
  appKitModal.setConnectedWalletInfo(null, "solana");
  appKitModal.setProfileImage(null, "solana");
  try {
    await appKitModal.close();
  } catch {
    /* non-blocking */
  }
}

/** Clear Phantom + AppKit (programmatic disconnect). */
export async function disconnectNattPunditWallet(): Promise<void> {
  clearPhantomMobileSession();
  if (isMobileExternalBrowser()) {
    await resetPhantomMirroredAppKitAccount();
  } else {
    deactivatePhantomMobileConnector();
    try {
      await getNattPunditAppKitModal()?.disconnect("solana");
    } catch {
      await resetPhantomMirroredAppKitAccount();
    }
  }
  window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
}

function ensurePhantomAppKitDisconnectBridge(): void {
  if (phantomDisconnectBridgeReady || !appKitModal) return;
  phantomDisconnectBridgeReady = true;

  window.addEventListener("phantom-connect-complete", () => {
    const session = loadPhantomMobileSession();
    if (!session) return;
    syncPhantomMobileSessionToAppKit(session);
  });

  // User tapped Disconnect in Reown Account view.
  appKitModal.subscribeEvents((events) => {
    const payload = events.data;
    if (payload?.type !== "track") return;
    if (payload.event === "DISCONNECT_SUCCESS") {
      clearPhantomMobileSession();
      deactivatePhantomMobileConnector();
      window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
      return;
    }
    if (payload.event === "DISCONNECT_ERROR" && loadPhantomMobileSession()) {
      void disconnectNattPunditWallet();
    }
  });

  // Edge-trigger only (open false -> true). Never call setBalance inside a tight subscribe loop.
  appKitModal.subscribeState((state) => {
    if (state.open) {
      if (modalOpenEdge) return;
      modalOpenEdge = true;
      const session = loadPhantomMobileSession();
      if (session) {
        void pushPhantomBalanceAfterModalOpen(session.publicKey);
      }
      return;
    }
    modalOpenEdge = false;
    cancelPhantomAccountUiPush();
  });

  // If user disconnects in modal, clear phantom storage when AppKit drops connection.
  let wasAccountConnected = false;
  appKitModal.subscribeAccount((acc) => {
    const nowConnected = Boolean(acc?.isConnected);
    if (wasAccountConnected && !nowConnected && appKitModal?.isOpen()) {
      if (loadPhantomMobileSession()) {
        clearPhantomMobileSession();
        deactivatePhantomMobileConnector();
        window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
      }
    }
    wasAccountConnected = nowConnected;
  }, "solana");
}

/** Open Reown modal — Account + Disconnect when Phantom mobile session is active. */
export function openNattPunditWalletModal(
  open: (options: {
    view: "Account" | "Connect";
    namespace: ChainNamespace;
  }) => void | Promise<void | { hash: string }>,
  isConnected: boolean,
): void {
  ensureNattPunditAppKit();
  syncNattPunditAppKitMetadata();
  const session = loadPhantomMobileSession();
  const openAccount = isConnected || Boolean(session);
  if (session && openAccount) {
    syncPhantomMobileSessionToAppKit(session);
  }
  try {
    void open({ view: openAccount ? "Account" : "Connect", namespace: "solana" });
  } catch (err) {
    console.error("natt_pundit_wallet_modal_open_failed", err);
  }
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
    // Mobile Chrome: no WC auto-reconnect — Phantom uses deeplink session only.
    enableReconnect: !mobileExternal,
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
              image_url: phantomWalletIconForAppKit(),
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
  ensurePhantomMobileConnectorRegistered();
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
