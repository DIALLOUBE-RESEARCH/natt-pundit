/** Mobile Chrome/Safari (not Phantom in-app WebView). */
export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isPhantomInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Window & { phantom?: { solana?: { isPhantom?: boolean } } };
  return Boolean(w.phantom?.solana?.isPhantom) && isMobileUserAgent();
}

/** Phone browser where Phantom deeplink + HTTPS redirect is the right connect path. */
export function isMobileExternalBrowser(): boolean {
  return isMobileUserAgent() && !isPhantomInAppBrowser();
}
