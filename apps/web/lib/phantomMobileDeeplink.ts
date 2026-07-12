import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { appKitMetadata } from "@/config/wallet";
import { escrowCluster } from "@/lib/escrowCluster";
import type { ConnectedWallet } from "@/lib/solanaWallet";

export const PHANTOM_WALLET_REOWN_ID =
  "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393";

const SESSION_STORAGE_KEY = "nattpundit.phantom_mobile.session";
const PENDING_SIGN_KEY = "nattpundit.phantom_mobile.pending_sign";
const DAPP_SECRET_KEY = "nattpundit.phantom_mobile.dapp_secret";
const RETURN_HREF_KEY = "nattpundit.phantom_mobile.return_href";
const SIGN_RESULT_KEY = "nattpundit.phantom_mobile.sign_result";
const SIGN_BACKUP_COOKIE = "natt_pd_sign_backup";
const SESSION_BACKUP_COOKIE = "natt_pd_sess_backup";

export type PhantomSignResult = {
  signature: string;
  fixtureId: string;
  action: string;
  returnPath: string;
};

function persistDappSecret(encoded: string): void {
  try {
    sessionStorage.setItem(DAPP_SECRET_KEY, encoded);
    localStorage.setItem(DAPP_SECRET_KEY, encoded);
  } catch {
    /* ignore */
  }
}

function readPersistedDappSecret(): string | null {
  try {
    return sessionStorage.getItem(DAPP_SECRET_KEY) ?? localStorage.getItem(DAPP_SECRET_KEY);
  } catch {
    return null;
  }
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";
const PHANTOM_CALLBACK_PATH = `${BASE_PATH}/wallet/phantom-return`;

export type PhantomMobileSession = {
  publicKey: string;
  session: string;
  sharedSecretB58: string;
  dappSecretKeyB58: string;
  dappPublicKeyB58: string;
  phantomEncryptionPublicKeyB58: string;
};

export type PhantomPendingSign = {
  fixtureId: string;
  action: string;
  returnPath: string;
};

function setCookie(name: string, value: string, maxAgeSec = 900): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; Secure; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}

function backupPhantomSignState(pending: PhantomPendingSign, session: PhantomMobileSession): void {
  try {
    setCookie(SIGN_BACKUP_COOKIE, JSON.stringify(pending));
    setCookie(SESSION_BACKUP_COOKIE, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function restorePhantomSessionFromBackup(): PhantomMobileSession | null {
  const loaded = loadPhantomMobileSession();
  if (loaded) return loaded;
  try {
    const raw = readCookie(SESSION_BACKUP_COOKIE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhantomMobileSession;
    if (!parsed.publicKey || !parsed.session || !parsed.sharedSecretB58) return null;
    savePhantomMobileSession(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function restorePhantomPendingFromBackup(): PhantomPendingSign | null {
  const loaded = loadPhantomPendingSign();
  if (loaded) return loaded;
  try {
    const raw = readCookie(SIGN_BACKUP_COOKIE);
    return raw ? (JSON.parse(raw) as PhantomPendingSign) : null;
  } catch {
    return null;
  }
}

function clearPhantomSignBackup(): void {
  clearCookie(SIGN_BACKUP_COOKIE);
  clearCookie(SESSION_BACKUP_COOKIE);
}

function buildSignRedirectUrl(returnPath: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://hypernatt.com";
  const url = new URL(`${origin}${returnPath}`);
  url.searchParams.set("phantom_cb", "signTransaction");
  return url.toString();
}

function readSignMetaFromUrl(): Partial<PhantomPendingSign> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fixtureId = params.get("natt_phantom_fixture") ?? undefined;
  const action = params.get("natt_phantom_action") ?? undefined;
  const returnPath = `${window.location.pathname}${window.location.search}`;
  return { fixtureId, action, returnPath };
}

export type PhantomSignFailure = {
  code: string;
  message: string;
};

export function consumePhantomSignFailure(): PhantomSignFailure | null {
  try {
    const raw =
      sessionStorage.getItem("nattpundit.phantom_mobile.sign_error") ??
      localStorage.getItem("nattpundit.phantom_mobile.sign_error");
    sessionStorage.removeItem("nattpundit.phantom_mobile.sign_error");
    localStorage.removeItem("nattpundit.phantom_mobile.sign_error");
    return raw ? (JSON.parse(raw) as PhantomSignFailure) : null;
  } catch {
    return null;
  }
}

function stashPhantomSignFailure(code: string, message: string): void {
  const raw = JSON.stringify({ code, message });
  try {
    sessionStorage.setItem("nattpundit.phantom_mobile.sign_error", raw);
    localStorage.setItem("nattpundit.phantom_mobile.sign_error", raw);
  } catch {
    /* ignore */
  }
}

let escrowSignMeta: { fixtureId: string; action: string } = {
  fixtureId: "unknown",
  action: "escrow",
};

export function setPhantomEscrowSignMeta(meta: { fixtureId: string; action: string }): void {
  escrowSignMeta = meta;
}

type PhantomCallback = "connect" | "signTransaction";

function phantomClusterParam(): "devnet" | "mainnet-beta" {
  return escrowCluster() === "devnet" ? "devnet" : "mainnet-beta";
}

function readDappKeyPair(): nacl.BoxKeyPair {
  if (typeof window === "undefined") return nacl.box.keyPair();
  try {
    const stored = readPersistedDappSecret();
    if (stored) {
      const secretKey = bs58.decode(stored);
      const publicKey = nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
      return { publicKey, secretKey };
    }
  } catch {
    /* fresh keypair */
  }
  const kp = nacl.box.keyPair();
  persistDappSecret(bs58.encode(kp.secretKey));
  return kp;
}

function decryptPayload(data: string, nonce: string, sharedSecret: Uint8Array): unknown {
  const decrypted = nacl.box.open.after(bs58.decode(data), bs58.decode(nonce), sharedSecret);
  if (!decrypted) throw new Error("phantom_decrypt_failed");
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function encryptPayload(payload: unknown, sharedSecret: Uint8Array): { nonce: string; payload: string } {
  const nonceBytes = nacl.randomBytes(24);
  const encrypted = nacl.box.after(
    new TextEncoder().encode(JSON.stringify(payload)),
    nonceBytes,
    sharedSecret,
  );
  return { nonce: bs58.encode(nonceBytes), payload: bs58.encode(encrypted) };
}

function dappAppUrl(): string {
  if (typeof window === "undefined") return appKitMetadata.url;
  return `${window.location.origin}${BASE_PATH}`;
}

function buildRedirectUrl(callback: PhantomCallback): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://hypernatt.com";
  const url = new URL(`${origin}${PHANTOM_CALLBACK_PATH}`);
  url.searchParams.set("phantom_cb", callback);
  return url.toString();
}

function buildPhantomUrl(path: string, params: URLSearchParams): string {
  return `https://phantom.app/ul/v1/${path}?${params.toString()}`;
}

export function loadPhantomMobileSession(): PhantomMobileSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(SESSION_STORAGE_KEY) ?? localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhantomMobileSession;
    if (!parsed.publicKey || !parsed.session || !parsed.sharedSecretB58) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePhantomMobileSession(session: PhantomMobileSession): void {
  const raw = JSON.stringify(session);
  sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function clearPhantomMobileSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(DAPP_SECRET_KEY);
  sessionStorage.removeItem(PENDING_SIGN_KEY);
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(DAPP_SECRET_KEY);
    localStorage.removeItem(PENDING_SIGN_KEY);
    localStorage.removeItem(RETURN_HREF_KEY);
    localStorage.removeItem(SIGN_RESULT_KEY);
  } catch {
    /* ignore */
  }
}

export function consumePhantomReturnHref(): string | null {
  if (typeof window === "undefined") return null;
  const href =
    sessionStorage.getItem(RETURN_HREF_KEY) ?? localStorage.getItem(RETURN_HREF_KEY);
  sessionStorage.removeItem(RETURN_HREF_KEY);
  try {
    localStorage.removeItem(RETURN_HREF_KEY);
  } catch {
    /* ignore */
  }
  return href;
}

export function startPhantomMobileConnect(): void {
  if (typeof window !== "undefined") {
    const href = window.location.href.split("#")[0];
    sessionStorage.setItem(RETURN_HREF_KEY, href);
    try {
      localStorage.setItem(RETURN_HREF_KEY, href);
    } catch {
      /* ignore */
    }
  }
  const dappKeyPair = readDappKeyPair();
  const params = new URLSearchParams({
    app_url: dappAppUrl(),
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    redirect_link: buildRedirectUrl("connect"),
    cluster: phantomClusterParam(),
  });
  window.location.href = buildPhantomUrl("connect", params);
}

export async function handlePhantomMobilePageReturn(connection: Connection): Promise<{
  type: "connect" | "sign" | "error" | "none";
  signResult?: { signature: string; fixtureId: string; action: string; returnPath: string };
  error?: string;
}> {
  if (typeof window === "undefined") return { type: "none" };
  const params = new URLSearchParams(window.location.search);
  const cb = params.get("phantom_cb");

  if (params.get("errorCode")) {
    const msg = params.get("errorMessage") ?? params.get("errorCode") ?? "phantom_rejected";
    if (cb === "signTransaction") {
      stashPhantomSignFailure("phantom_rejected", msg);
    }
    cleanPhantomQueryParams();
    return { type: "error", error: msg };
  }

  if (cb === "connect" && params.get("data") && params.get("nonce")) {
    try {
      const dappKeyPair = readDappKeyPair();
      const phantomPk = params.get("phantom_encryption_public_key");
      if (!phantomPk) throw new Error("phantom_missing_key");
      const sharedSecret = nacl.box.before(bs58.decode(phantomPk), dappKeyPair.secretKey);
      const connectData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        sharedSecret,
      ) as { public_key: string; session: string };

      savePhantomMobileSession({
        publicKey: connectData.public_key,
        session: connectData.session,
        sharedSecretB58: bs58.encode(sharedSecret),
        dappSecretKeyB58: bs58.encode(dappKeyPair.secretKey),
        dappPublicKeyB58: bs58.encode(dappKeyPair.publicKey),
        phantomEncryptionPublicKeyB58: phantomPk,
      });
      cleanPhantomQueryParams();
      return { type: "connect" };
    } catch {
      cleanPhantomQueryParams();
      return { type: "error", error: "phantom_connect_parse_failed" };
    }
  }

  if (cb === "signTransaction" && params.get("data") && params.get("nonce")) {
    const signResult = await completePhantomSignReturn(connection);
    return signResult.ok
      ? { type: "sign", signResult: signResult.result }
      : { type: "error", error: signResult.error };
  }

  return { type: "none" };
}

export function cleanPhantomQueryParams(): void {
  const url = new URL(window.location.href);
  for (const key of [
    "phantom_cb",
    "phantom_encryption_public_key",
    "nonce",
    "data",
    "errorCode",
    "errorMessage",
    "natt_phantom_fixture",
    "natt_phantom_action",
  ]) {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function setPhantomPendingSign(pending: PhantomPendingSign): void {
  const raw = JSON.stringify(pending);
  sessionStorage.setItem(PENDING_SIGN_KEY, raw);
  try {
    localStorage.setItem(PENDING_SIGN_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function loadPhantomPendingSign(): PhantomPendingSign | null {
  try {
    const raw =
      sessionStorage.getItem(PENDING_SIGN_KEY) ?? localStorage.getItem(PENDING_SIGN_KEY);
    return raw ? (JSON.parse(raw) as PhantomPendingSign) : null;
  } catch {
    return null;
  }
}

export function clearPhantomPendingSign(): void {
  sessionStorage.removeItem(PENDING_SIGN_KEY);
  try {
    localStorage.removeItem(PENDING_SIGN_KEY);
  } catch {
    /* ignore */
  }
}

export function stashPhantomSignResult(result: PhantomSignResult): void {
  const raw = JSON.stringify(result);
  try {
    sessionStorage.setItem(SIGN_RESULT_KEY, raw);
    localStorage.setItem(SIGN_RESULT_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function consumePhantomSignResult(): PhantomSignResult | null {
  try {
    const raw =
      sessionStorage.getItem(SIGN_RESULT_KEY) ?? localStorage.getItem(SIGN_RESULT_KEY);
    sessionStorage.removeItem(SIGN_RESULT_KEY);
    localStorage.removeItem(SIGN_RESULT_KEY);
    return raw ? (JSON.parse(raw) as PhantomSignResult) : null;
  } catch {
    return null;
  }
}

export function emitPhantomSignComplete(result: PhantomSignResult): void {
  stashPhantomSignResult(result);
  window.dispatchEvent(new CustomEvent("phantom-sign-complete", { detail: result }));
}

function persistReturnHref(): void {
  if (typeof window === "undefined") return;
  const href = window.location.href.split("#")[0];
  sessionStorage.setItem(RETURN_HREF_KEY, href);
  try {
    localStorage.setItem(RETURN_HREF_KEY, href);
  } catch {
    /* ignore */
  }
}

export function redirectPhantomSignTransaction(
  tx: Transaction,
  meta: Omit<PhantomPendingSign, "returnPath">,
): void {
  const session = loadPhantomMobileSession();
  if (!session) throw new Error("phantom_not_connected");

  const sharedSecret = bs58.decode(session.sharedSecretB58);
  const serialized = bs58.encode(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  );
  const encrypted = encryptPayload({ session: session.session, transaction: serialized }, sharedSecret);

  const current = new URL(window.location.href);
  current.searchParams.set("natt_phantom_fixture", meta.fixtureId);
  current.searchParams.set("natt_phantom_action", meta.action);
  const returnPath = `${current.pathname}${current.search}`;
  const pending: PhantomPendingSign = {
    ...meta,
    returnPath,
  };
  setPhantomPendingSign(pending);
  backupPhantomSignState(pending, session);
  persistReturnHref();

  const params = new URLSearchParams({
    app_url: dappAppUrl(),
    cluster: phantomClusterParam(),
    dapp_encryption_public_key: session.dappPublicKeyB58,
    nonce: encrypted.nonce,
    redirect_link: buildSignRedirectUrl(returnPath),
    payload: encrypted.payload,
  });
  window.location.href = buildPhantomUrl("signTransaction", params);
}

export async function completePhantomSignReturn(
  connection: Connection,
): Promise<
  | { ok: true; result: PhantomSignResult }
  | { ok: false; error: string }
> {
  const params = new URLSearchParams(window.location.search);
  if (params.get("phantom_cb") !== "signTransaction" || !params.get("data")) {
    return { ok: false, error: "phantom_sign_missing_callback" };
  }

  const urlMeta = readSignMetaFromUrl();
  const pending = restorePhantomPendingFromBackup();
  const session = restorePhantomSessionFromBackup();
  if (!session) {
    cleanPhantomQueryParams();
    stashPhantomSignFailure("phantom_session_lost", "Wallet session lost after Phantom return — reconnect and retry.");
    return { ok: false, error: "phantom_session_lost" };
  }

  const fixtureId = pending?.fixtureId ?? urlMeta.fixtureId ?? escrowSignMeta.fixtureId ?? "unknown";
  const action = pending?.action ?? urlMeta.action ?? escrowSignMeta.action ?? "escrow";
  const storedHref =
    sessionStorage.getItem(RETURN_HREF_KEY) ?? localStorage.getItem(RETURN_HREF_KEY);
  const returnPath = pending?.returnPath ?? storedHref ?? urlMeta.returnPath ?? BASE_PATH;

  try {
    const sharedSecret = bs58.decode(session.sharedSecretB58);
    const signData = decryptPayload(params.get("data")!, params.get("nonce")!, sharedSecret) as {
      transaction: string;
    };
    const signed = Transaction.from(bs58.decode(signData.transaction));
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      preflightCommitment: "confirmed",
      maxRetries: 5,
    });
    void connection.confirmTransaction(signature, "confirmed").catch(() => {
      /* non-blocking — tx already submitted */
    });
    clearPhantomPendingSign();
    clearPhantomSignBackup();
    cleanPhantomQueryParams();
    return {
      ok: true,
      result: {
        signature,
        fixtureId,
        action,
        returnPath,
      },
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "phantom_sign_send_failed";
    cleanPhantomQueryParams();
    stashPhantomSignFailure("phantom_sign_send_failed", message);
    return { ok: false, error: message };
  }
}

export function phantomMobileConnectedWallet(
  session: PhantomMobileSession,
  connection: Connection,
): ConnectedWallet {
  return {
    name: "Phantom",
    address: session.publicKey,
    signMessage: async () => {
      throw new Error("phantom_mobile_sign_message_unsupported");
    },
    signAndSendTransaction: async (tx, connOverride) => {
      const conn = connOverride ?? connection;
      const { blockhash } = await conn.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = tx.feePayer ?? new PublicKey(session.publicKey);
      redirectPhantomSignTransaction(tx, escrowSignMeta);
      throw new Error("phantom_mobile_redirect");
    },
  };
}
