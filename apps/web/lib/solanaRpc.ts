import { GATEWAY_URL } from "./api";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";

/** Browser-safe JSON-RPC (Next.js API route — same origin). */
export function getSolanaRpcUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${basePath}/api/solana/rpc`;
  }
  return `${GATEWAY_URL}/v1/solana/rpc`;
}
