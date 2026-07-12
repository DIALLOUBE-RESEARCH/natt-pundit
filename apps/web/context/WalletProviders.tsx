"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { MobilePhantomWalletIntercept } from "@/components/MobilePhantomWalletIntercept";
import { PhantomMobileProvider } from "@/context/PhantomMobileProvider";
import { ensureNattPunditAppKit } from "@/lib/nattPunditAppKit";

export default function WalletProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  ensureNattPunditAppKit();

  return (
    <QueryClientProvider client={queryClient}>
      <PhantomMobileProvider>
        <MobilePhantomWalletIntercept />
        {children}
      </PhantomMobileProvider>
    </QueryClientProvider>
  );
}
