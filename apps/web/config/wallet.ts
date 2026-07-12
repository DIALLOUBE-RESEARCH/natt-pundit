import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { solana, solanaDevnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

/** Same Reown project as HyperNatt frontend — set on VPS via NEXT_PUBLIC_PROJECT_ID */
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const escrowDevnet = process.env.NEXT_PUBLIC_NATT_ESCROW_CLUSTER !== "mainnet";

export const solanaNetworks: [AppKitNetwork, ...AppKitNetwork[]] = escrowDevnet
  ? [solanaDevnet, solana]
  : [solana];

export const defaultSolanaNetwork = escrowDevnet ? solanaDevnet : solana;

/** Injected adapters for reconnect after refresh; user still picks wallet in Reown modal. */
export const solanaAdapter = new SolanaAdapter({
  wallets:
    typeof window !== "undefined"
      ? [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
      : [],
});

const NATT_PUNDIT_BASE = "/fr/nattpundit";

export const appKitMetadata = {
  name: "Natt Settlement",
  description: "TxODDS World Cup — prediction markets & Merkle settlement",
  url:
    typeof window !== "undefined"
      ? `${window.location.origin}${NATT_PUNDIT_BASE}`
      : `https://hypernatt.com${NATT_PUNDIT_BASE}`,
  icons: ["https://hypernatt.com/favicon.png"],
};
