import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

/** Built-in allowlist (owner). Extend via `NATT_DATAS_EXPORT_WHITELIST` (comma-separated pubkeys). */
const BUILTIN_EXPORT_ALLOWLIST: readonly string[] = [
  "Eygd1V74pe9wNzsApnfWhFF1L9SMtBsLCGPNc17m834f",
];

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const DOWNLOAD_TTL_MS = 2 * 60 * 1000;

export type ExportChallenge = {
  nonce: string;
  message: string;
  expiresAt: string;
};

export function exportAllowlist(): Set<string> {
  const fromEnv = (process.env.NATT_DATAS_EXPORT_WHITELIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...BUILTIN_EXPORT_ALLOWLIST, ...fromEnv]);
}

export function isExportAllowlisted(pubkey: string): boolean {
  try {
    const normalized = new PublicKey(pubkey).toBase58();
    return exportAllowlist().has(normalized);
  } catch {
    return false;
  }
}

export function buildExportChallengeMessage(nonce: string, expiresAtMs: number): string {
  const iso = new Date(expiresAtMs).toISOString();
  return `Download Data Lab export — nonce: ${nonce} — expires: ${iso}`;
}

export function createExportChallenge(nowMs = Date.now()): ExportChallenge {
  const nonce = randomUUID();
  const expiresAtMs = nowMs + CHALLENGE_TTL_MS;
  return {
    nonce,
    message: buildExportChallengeMessage(nonce, expiresAtMs),
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function parseChallengeExpiry(message: string): number | null {
  const m = message.match(/expires:\s*(\S+)/);
  if (!m) return null;
  const ts = Date.parse(m[1]);
  return Number.isFinite(ts) ? ts : null;
}

export function parseChallengeNonce(message: string): string | null {
  const m = message.match(/nonce:\s*([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

export function verifySiwsExportSignature(input: {
  message: string;
  signatureBase58: string;
  pubkey: string;
  nowMs?: number;
}): { ok: true; pubkey: string; nonce: string } | { ok: false; reason: string } {
  const nowMs = input.nowMs ?? Date.now();
  if (!input.message.startsWith("Download Data Lab export")) {
    return { ok: false, reason: "invalid_message_prefix" };
  }
  const expiresAt = parseChallengeExpiry(input.message);
  if (expiresAt === null) return { ok: false, reason: "invalid_expiry" };
  if (nowMs > expiresAt) return { ok: false, reason: "challenge_expired" };

  const nonce = parseChallengeNonce(input.message);
  if (!nonce) return { ok: false, reason: "invalid_nonce" };

  let pubkey: string;
  try {
    pubkey = new PublicKey(input.pubkey).toBase58();
  } catch {
    return { ok: false, reason: "invalid_pubkey" };
  }

  if (!isExportAllowlisted(pubkey)) {
    return { ok: false, reason: "not_allowlisted" };
  }

  let sigBytes: Uint8Array;
  try {
    sigBytes = bs58.decode(input.signatureBase58);
  } catch {
    return { ok: false, reason: "invalid_signature_encoding" };
  }

  const msgBytes = new TextEncoder().encode(input.message);
  const keyBytes = new PublicKey(pubkey).toBytes();
  const valid = nacl.sign.detached.verify(msgBytes, sigBytes, keyBytes);
  if (!valid) return { ok: false, reason: "signature_mismatch" };

  return { ok: true, pubkey, nonce };
}

function tokenSecret(): string | null {
  const s = process.env.NATT_DATAS_EXPORT_TOKEN_SECRET?.trim();
  return s || null;
}

function signTokenPayload(payload: string): string {
  const secret = tokenSecret();
  if (!secret) throw new Error("NATT_DATAS_EXPORT_TOKEN_SECRET not configured");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Short-lived download token (HMAC). No URL without prior SIWS verify. */
export function mintExportDownloadToken(input: {
  pubkey: string;
  nonce: string;
  nowMs?: number;
}): string {
  const nowMs = input.nowMs ?? Date.now();
  const exp = nowMs + DOWNLOAD_TTL_MS;
  const body = JSON.stringify({
    v: 1,
    pubkey: input.pubkey,
    nonce: input.nonce,
    exp,
  });
  const bodyB64 = Buffer.from(body, "utf8").toString("base64url");
  const sig = signTokenPayload(bodyB64);
  return `${bodyB64}.${sig}`;
}

export function verifyExportDownloadToken(
  token: string,
  nowMs = Date.now(),
): { ok: true; pubkey: string; nonce: string } | { ok: false; reason: string } {
  const secret = tokenSecret();
  if (!secret) return { ok: false, reason: "token_secret_missing" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed_token" };
  const [bodyB64, sig] = parts;
  const expected = signTokenPayload(bodyB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_token_signature" };
  }

  let parsed: { v?: number; pubkey?: string; nonce?: string; exp?: number };
  try {
    parsed = JSON.parse(Buffer.from(bodyB64, "base64url").toString("utf8")) as typeof parsed;
  } catch {
    return { ok: false, reason: "bad_token_body" };
  }

  if (parsed.v !== 1 || !parsed.pubkey || !parsed.nonce || typeof parsed.exp !== "number") {
    return { ok: false, reason: "bad_token_fields" };
  }
  if (nowMs > parsed.exp) return { ok: false, reason: "token_expired" };
  if (!isExportAllowlisted(parsed.pubkey)) return { ok: false, reason: "not_allowlisted" };

  return { ok: true, pubkey: parsed.pubkey, nonce: parsed.nonce };
}

export function internalExportSecret(): string | null {
  const s = process.env.NATT_DATAS_EXPORT_INTERNAL_SECRET?.trim();
  return s || null;
}
