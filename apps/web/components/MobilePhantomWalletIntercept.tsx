"use client";

import { useEffect } from "react";
import {
  getNattPunditAppKitModal,
  NATT_PHANTOM_CUSTOM_WALLET_ID,
  syncNattPunditAppKitMetadata,
} from "@/features/wallet/nattPunditAppKit";
import { isMobileExternalBrowser } from "@/lib/mobileBrowser";
import { PHANTOM_WALLET_REOWN_ID, startPhantomMobileConnect } from "@/lib/phantomMobileDeeplink";

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

    const walletId =
      node.getAttribute("data-wallet-id") ??
      node.closest("[data-wallet-id]")?.getAttribute("data-wallet-id");
    if (walletId === PHANTOM_WALLET_REOWN_ID || walletId === NATT_PHANTOM_CUSTOM_WALLET_ID) {
      return true;
    }

    if (!isInsideWalletModal(node)) continue;

    const name = node.getAttribute("name") ?? node.closest("[name]")?.getAttribute("name");
    if (name?.toLowerCase() === "phantom") return true;

    const label = node.textContent?.trim().toLowerCase() ?? "";
    if (label === "phantom" || (label.includes("phantom") && !label.includes("walletconnect"))) {
      return true;
    }
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

    const opts: AddEventListenerOptions = { capture: true, passive: false };
    document.addEventListener("touchstart", onPhantomTap, opts);
    document.addEventListener("pointerdown", onPhantomTap, opts);
    document.addEventListener("click", onPhantomTap, opts);
    return () => {
      document.removeEventListener("touchstart", onPhantomTap, opts);
      document.removeEventListener("pointerdown", onPhantomTap, opts);
      document.removeEventListener("click", onPhantomTap, opts);
    };
  }, []);

  return null;
}
