import { Connection } from "@solana/web3.js";
import { Agent, fetch as undiciFetch } from "undici";
import { SOLANA_DEVNET_RPC } from "@/lib/escrowCluster";

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

function makeFetch(strictTls: boolean): typeof fetch {
  if (strictTls) return fetch;
  return ((url: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(url as string, {
      ...init,
      dispatcher: insecureDispatcher,
    } as Parameters<typeof undiciFetch>[1])) as unknown as typeof fetch;
}

export async function serverEscrowConnection(): Promise<Connection> {
  const url = process.env.SOLANA_DEVNET_RPC_URL?.trim() || SOLANA_DEVNET_RPC;
  try {
    const conn = new Connection(url, { commitment: "confirmed", fetch: makeFetch(true) });
    await conn.getVersion();
    return conn;
  } catch {
    return new Connection(url, { commitment: "confirmed", fetch: makeFetch(false) });
  }
}
