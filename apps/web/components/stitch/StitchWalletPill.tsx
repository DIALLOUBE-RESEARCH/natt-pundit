"use client";

import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { usePresent } from "@/components/present/PresentProvider";
import {
  ensureNattPunditAppKit,
  openNattPunditWalletModal,
  syncNattPunditAppKitTheme,
} from "@/features/wallet/nattPunditAppKit";
import { useSolanaConnectedWallet } from "@/hooks/useSolanaConnectedWallet";
import type { StitchThemeMode } from "@/shared/theme/stitchTheme";
import { shell } from "@/lib/appShellI18n";
import { useAppKit } from "@reown/appkit/react";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function readLiveStitchTheme(): StitchThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function StitchWalletPillInner() {
  const { open } = useAppKit();
  const { address, isConnected } = useSolanaConnectedWallet();
  const { lang } = usePresent();
  const s = shell(lang);
  const label = isConnected && address ? shortAddr(address) : s.walletLabel;

  return (
    <LiquidGlassPill
      variant="wallet"
      className="stitch-lg-pill--header"
      onClick={() => {
        const theme = readLiveStitchTheme();
        ensureNattPunditAppKit();
        syncNattPunditAppKitTheme(theme);
        openNattPunditWalletModal(open, isConnected);
      }}
      title={s.walletLabel}
    >
      {label}
    </LiquidGlassPill>
  );
}

export function StitchWalletPill() {
  const hasProjectId = Boolean(process.env.NEXT_PUBLIC_PROJECT_ID);
  const { lang } = usePresent();
  const s = shell(lang);

  if (!hasProjectId) {
    return (
      <LiquidGlassPill variant="wallet" className="stitch-lg-pill--header" style={{ opacity: 0.55 }}>
        {s.walletLabel}
      </LiquidGlassPill>
    );
  }

  return <StitchWalletPillInner />;
}
