import { TXLINE_API_BASE } from "@natt-pundit/natt-core";

type CacheEntry = { at: number; data: unknown };

let guestCache: { token: string; at: number } | null = null;
const GUEST_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, CacheEntry>();

function cacheTtlMs(): number {
  const sec = Number(process.env.CACHE_TTL_SEC ?? "10");
  return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 10_000;
}

export function apiToken(): string {
  const token = process.env.TXLINE_API_TOKEN?.trim();
  if (!token) throw new Error("TXLINE_API_TOKEN missing");
  return token;
}

async function guestJwtCached(): Promise<string> {
  const now = Date.now();
  if (guestCache && now - guestCache.at < GUEST_TTL_MS) {
    return guestCache.token;
  }
  const res = await fetch(`${TXLINE_API_BASE}/auth/guest/start`, { method: "POST" });
  if (!res.ok) throw new Error(`guest auth failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  guestCache = { token: data.token, at: now };
  return data.token;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const jwt = await guestJwtCached();
  return {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": apiToken(),
    "Content-Type": "application/json",
  };
}

export async function txlineGet<T>(path: string): Promise<T> {
  const hit = responseCache.get(path);
  const now = Date.now();
  if (hit && now - hit.at < cacheTtlMs()) {
    return hit.data as T;
  }

  const res = await fetch(`${TXLINE_API_BASE}${path}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`txline GET ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as T;
  responseCache.set(path, { at: now, data });
  return data;
}

export function clearTxlineCache(): void {
  responseCache.clear();
}
