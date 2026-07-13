"use client";

import { useEffect } from "react";
import {
  disconnectNattPunditWallet,
  getNattPunditAppKitModal,
  NATT_PHANTOM_CUSTOM_WALLET_ID,
  syncNattPunditAppKitMetadata,
} from "@/features/wallet/nattPunditAppKit";
import { isMobileExternalBrowser } from "@/lib/mobileBrowser";
import {
  loadPhantomMobileSession,
  PHANTOM_WALLET_REOWN_ID,
  startPhantomMobileConnect,
} from "@/lib/phantomMobileDeeplink";

function isInsideWalletModal(node: HTMLElement): boolean {
  return Boolean(
    node.closest(
      "w3m-modal, wcm-modal, appkit-modal, w3m-router, wui-flex, [class*='w3m'], [class*='wui']",
    ),
  );
}

function isPhantomWalletTarget(event: Event): boolean {
  const path = event.composedPath?.() ?? [event.target];
  for (const node of path) {
    if (!(node instanceof HTMLElement)) continue;
    if (!isInsideWalletModal(node)) continue;

    const walletId =
      node.getAttribute("data-wallet-id") ??
      node.closest("[data-wallet-id]")?.getAttribute("data-wallet-id");
    if (walletId === PHANTOM_WALLET_REOWN_ID || walletId === NATT_PHANTOM_CUSTOM_WALLET_ID) {
      return true;
    }

    const name = node.getAttribute("name") ?? node.closest("[name]")?.getAttribute("name");
    if (name?.toLowerCase() === "phantom") return true;

    const label = node.textContent?.trim().toLowerCase() ?? "";
    if (label === "phantom" || (label.includes("phantom") && !label.includes("walletconnect"))) {
      return true;
    }
  }
  return false;
}

function isPhantomDisconnectTarget(event: Event): boolean {
  const path = event.composedPath?.() ?? [event.target];
  for (const node of path) {
    if (!(node instanceof HTMLElement)) continue;
    if (!isInsideWalletModal(node)) continue;
    if (node.closest('[data-testid="disconnect-button"]')) return true;
    const item = node.closest("wui-list-item");
    const label = item?.textContent?.trim().toLowerCase() ?? "";
    if (label.includes("disconnect")) return true;
  }
  return false;
}

/** Connect Wallet modal unchanged — Phantom tap on mobile Chrome → approve in app → return Chrome. */
export function MobilePhantomWalletIntercept() {
  useEffect(() => {
    if (!isMobileExternalBrowser()) return;

    const onPhantomTap = (event: Event) => {
      if (!isPhantomWalletTarget(event)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      getNattPunditAppKitModal()?.close?.();
      syncNattPunditAppKitMetadata();
      startPhantomMobileConnect();
    };

    const onDisconnectTap = (event: Event) => {
      if (!loadPhantomMobileSession()) return;
      if (!isPhantomDisconnectTarget(event)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void disconnectNattPunditWallet();
    };

    const opts: AddEventListenerOptions = { capture: true, passive: false };
    document.addEventListener("touchstart", onPhantomTap, opts);
    document.addEventListener("pointerdown", onPhantomTap, opts);
    document.addEventListener("click", onPhantomTap, opts);
    document.addEventListener("touchstart", onDisconnectTap, opts);
    document.addEventListener("pointerdown", onDisconnectTap, opts);
    document.addEventListener("click", onDisconnectTap, opts);
    return () => {
      document.removeEventListener("touchstart", onPhantomTap, opts);
      document.removeEventListener("pointerdown", onPhantomTap, opts);
      document.removeEventListener("click", onPhantomTap, opts);
      document.removeEventListener("touchstart", onDisconnectTap, opts);
      document.removeEventListener("pointerdown", onDisconnectTap, opts);
      document.removeEventListener("click", onDisconnectTap, opts);
    };
  }, []);

  return null;
}
