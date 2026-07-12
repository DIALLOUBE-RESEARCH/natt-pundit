import {
  parseEscrowCluster,
  txlineApiBase,
  txlineProgramId,
  type EscrowCluster,
} from "@natt-pundit/natt-core";
import { apiToken } from "./txlineClient.js";

type CacheEntry = { at: number; data: unknown };

const guestCache = new Map<string, { token: string; at: number }>();
const GUEST_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, CacheEntry>();

function cacheTtlMs(): number {
  const sec = Number(process.env.CACHE_TTL_SEC ?? "10");
  return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 10_000;
}

export function escrowCluster(): EscrowCluster {
  return parseEscrowCluster(process.env.NATT_ESCROW_CLUSTER);
}

function escrowApiToken(cluster: EscrowCluster): string {
  if (cluster === "devnet") {
    const dev = process.env.TXLINE_DEV_API_TOKEN?.trim();
    if (dev) return dev;
  }
  return apiToken();
}

async function guestJwtCached(base: string): Promise<string> {
  const now = Date.now();
  const hit = guestCache.get(base);
  if (hit && now - hit.at < GUEST_TTL_MS) {
    return hit.token;
  }
  const res = await fetch(`${base}/auth/guest/start`, { method: "POST" });
  if (!res.ok) throw new Error(`guest auth failed (${base}): ${res.status}`);
  const data = (await res.json()) as { token: string };
  guestCache.set(base, { token: data.token, at: now });
  return data.token;
}

async function authHeaders(cluster: EscrowCluster): Promise<Record<string, string>> {
  const base = txlineApiBase(cluster);
  const jwt = await guestJwtCached(base);
  return {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": escrowApiToken(cluster),
    "Content-Type": "application/json",
  };
}

/** TxLINE GET for escrow CPI — uses devnet API when NATT_ESCROW_CLUSTER=devnet. */
export async function escrowTxlineGet<T>(path: string, cluster?: EscrowCluster): Promise<T> {
  const c = cluster ?? escrowCluster();
  const base = txlineApiBase(c);
  const cacheKey = `${c}:${path}`;
  const hit = responseCache.get(cacheKey);
  const now = Date.now();
  if (hit && now - hit.at < cacheTtlMs()) {
    return hit.data as T;
  }

  const res = await fetch(`${base}${path}`, {
    headers: await authHeaders(c),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`txline GET ${c} ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as T;
  responseCache.set(cacheKey, { at: now, data });
  return data;
}

export function escrowTxlineProgramId(cluster?: EscrowCluster): string {
  return txlineProgramId(cluster ?? escrowCluster());
}
