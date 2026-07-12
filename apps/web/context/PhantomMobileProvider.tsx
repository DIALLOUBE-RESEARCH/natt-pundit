"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { escrowConnection } from "@/lib/nattEscrow";
import {
  cleanPhantomQueryParams,
  consumePhantomSignFailure,
  emitPhantomSignComplete,
  handlePhantomMobilePageReturn,
  loadPhantomMobileSession,
  type PhantomMobileSession,
} from "@/lib/phantomMobileDeeplink";
import {
  disconnectNattPunditWallet,
  ensureNattPunditAppKit,
  syncPhantomMobileSessionToAppKit,
} from "@/features/wallet/nattPunditAppKit";

type PhantomMobileContextValue = {
  session: PhantomMobileSession | null;
  address: string | null;
  isPhantomMobile: boolean;
  disconnect: () => void;
  reloadSession: () => void;
};

const PhantomMobileContext = createContext<PhantomMobileContextValue | null>(null);

export function PhantomMobileProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PhantomMobileSession | null>(() =>
    typeof window === "undefined" ? null : loadPhantomMobileSession(),
  );
  const [bootstrapped, setBootstrapped] = useState(false);

  const reloadSession = useCallback(() => {
    const loaded = loadPhantomMobileSession();
    setSession(loaded);
    if (loaded) {
      ensureNattPunditAppKit();
      syncPhantomMobileSessionToAppKit(loaded);
    }
  }, []);

  const disconnect = useCallback(() => {
    void disconnectNattPunditWallet().then(() => setSession(null));
  }, []);

  useEffect(() => {
    reloadSession();
    const onConnect = () => reloadSession();
    window.addEventListener("phantom-connect-complete", onConnect);
    void (async () => {
      const isPhantomCallback =
        typeof window !== "undefined" &&
        window.location.pathname.endsWith("/wallet/phantom-return");
      if (isPhantomCallback) {
        setBootstrapped(true);
        return;
      }
      const result = await handlePhantomMobilePageReturn(escrowConnection());
      if (result.type === "connect") {
        reloadSession();
        window.dispatchEvent(new CustomEvent("phantom-connect-complete"));
      }
      if (result.type === "sign" && result.signResult) {
        queueMicrotask(() => emitPhantomSignComplete(result.signResult!));
        reloadSession();
      }
      if (result.type === "error") {
        const failure = consumePhantomSignFailure();
        window.dispatchEvent(
          new CustomEvent("phantom-sign-failed", {
            detail: failure ?? { code: result.error ?? "phantom_error", message: result.error ?? "phantom_error" },
          }),
        );
        cleanPhantomQueryParams();
      }
      setBootstrapped(true);
    })();
    return () => window.removeEventListener("phantom-connect-complete", onConnect);
  }, [reloadSession]);

  const value = useMemo(
    (): PhantomMobileContextValue => ({
      session,
      address: session?.publicKey ?? null,
      isPhantomMobile: Boolean(session),
      disconnect,
      reloadSession,
    }),
    [disconnect, reloadSession, session],
  );

  if (!bootstrapped && typeof window !== "undefined") {
    return (
      <PhantomMobileContext.Provider value={value}>{children}</PhantomMobileContext.Provider>
    );
  }

  return <PhantomMobileContext.Provider value={value}>{children}</PhantomMobileContext.Provider>;
}

export function usePhantomMobileContext(): PhantomMobileContextValue {
  const ctx = useContext(PhantomMobileContext);
  if (!ctx) {
    return {
      session: null,
      address: null,
      isPhantomMobile: false,
      disconnect: () => {},
      reloadSession: () => {},
    };
  }
  return ctx;
}
