import { Agent, fetch as undiciFetch } from "undici";

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

function needsLegacyTls(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "api.devnet.solana.com" || host === "api.testnet.solana.com";
  } catch {
    return false;
  }
}

/** POST JSON-RPC to Solana (TLS legacy fallback for expired api.devnet.solana.com cert). */
export async function postSolanaRpc(rpcUrl: string, body: string): Promise<Response> {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  } as const;

  if (!needsLegacyTls(rpcUrl)) {
    return fetch(rpcUrl, init);
  }

  try {
    const res = await fetch(rpcUrl, init);
    if (res.ok) return res;
  } catch {
    /* strict TLS failed — fall through */
  }

  return undiciFetch(rpcUrl, {
    ...init,
    dispatcher: insecureDispatcher,
  }) as unknown as Response;
}
