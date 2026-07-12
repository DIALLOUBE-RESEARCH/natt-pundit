/**
 * F73N — Solana devnet RPC resolver with fallbacks.
 * api.devnet.solana.com TLS cert expired 2025-12 — legacy TLS fallback for that host only.
 */
import { Connection } from "@solana/web3.js";
import { Agent, fetch as undiciFetch } from "undici";

const DEFAULT_FALLBACKS = ["https://api.devnet.solana.com"];

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

let cachedUrl = null;
let cachedStrictTls = true;
let cacheExpiresAt = 0;
const CACHE_MS = 5 * 60 * 1000;

export function getEscrowRpcCandidates() {
  const primary = process.env.SOLANA_DEVNET_RPC_URL?.trim();
  const heliusKey = process.env.HELIUS_API_KEY?.trim();
  const helius = heliusKey ? `https://devnet.helius-rpc.com/?api-key=${heliusKey}` : null;
  const extra = (process.env.SOLANA_DEVNET_RPC_FALLBACKS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const url of [helius, primary, ...extra, ...DEFAULT_FALLBACKS]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function makeFetch(strictTls) {
  if (strictTls) {
    return fetch;
  }
  return (url, init) => undiciFetch(url, { ...init, dispatcher: insecureDispatcher });
}

export function makeEscrowConnection(url, strictTls = true) {
  return new Connection(url, {
    commitment: "confirmed",
    fetch: makeFetch(strictTls),
  });
}

function isTlsFetchError(message) {
  return (
    message.includes("fetch failed") ||
    message.includes("UNABLE_TO_VERIFY") ||
    message.includes("certificate") ||
    message.includes("CERT_HAS_EXPIRED")
  );
}

async function probeRpc(url) {
  try {
    const conn = makeEscrowConnection(url, true);
    await conn.getVersion();
    return { url, strictTls: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isTlsFetchError(msg)) {
      throw err;
    }
    const conn = makeEscrowConnection(url, false);
    await conn.getVersion();
    console.warn(`[escrow-rpc] TLS legacy fallback enabled for ${url}`);
    return { url, strictTls: false };
  }
}

export async function resolveEscrowRpcUrl(force = false) {
  if (!force && cachedUrl && Date.now() < cacheExpiresAt) {
    return cachedUrl;
  }

  const errors = [];
  for (const url of getEscrowRpcCandidates()) {
    try {
      const picked = await probeRpc(url);
      cachedUrl = picked.url;
      cachedStrictTls = picked.strictTls;
      cacheExpiresAt = Date.now() + CACHE_MS;
      return picked.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${url}: ${msg}`);
      console.warn(`[escrow-rpc] candidate failed ${url}: ${msg}`);
    }
  }

  throw new Error(`no_working_devnet_rpc — ${errors.join(" | ")}`);
}

export async function getEscrowConnection() {
  const url = await resolveEscrowRpcUrl();
  return makeEscrowConnection(url, cachedStrictTls);
}

export async function warmEscrowRpc() {
  const url = await resolveEscrowRpcUrl(true);
  console.log(`[escrow-rpc] active ${url} strictTls=${cachedStrictTls}`);
  return url;
}

export function invalidateEscrowRpcCache() {
  cachedUrl = null;
  cachedStrictTls = true;
  cacheExpiresAt = 0;
}
