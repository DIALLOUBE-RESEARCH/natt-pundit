"use client";

import { useCallback, useEffect, useState } from "react";
import { GATEWAY_URL } from "@/lib/api";
import {
  bytesToBase64,
  connectSolanaWallet,
  listAvailableWallets,
  onWalletsChanged,
  type ConnectedWallet,
} from "@/lib/solanaWallet";
import { subscribeWcFreeTier } from "@/lib/txlineSubscribe";

export function ActivateTxline() {
  const [wallets, setWallets] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [connected, setConnected] = useState<ConnectedWallet | null>(null);
  const [txSig, setTxSig] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => setWallets(listAvailableWallets());
    refresh();
    return onWalletsChanged(refresh);
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const fresh = listAvailableWallets();
      if (fresh.length) setWallets(fresh);
      const id = selectedWalletId || fresh[0]?.id || wallets[0]?.id;
      if (!id) {
        throw new Error(
          "Aucun wallet Solana detecte. Installe Phantom ou active Solana dans MetaMask puis rafraichis.",
        );
      }
      const wallet = await connectSolanaWallet(id);
      setConnected(wallet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion wallet echouee");
    } finally {
      setBusy(false);
    }
  }, [selectedWalletId, wallets]);

  const runSubscribe = useCallback(async () => {
    if (!connected) {
      setError("Connecte ton wallet d'abord.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const sig = await subscribeWcFreeTier(connected);
      setTxSig(sig);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscribe echoue");
    } finally {
      setBusy(false);
    }
  }, [connected]);

  const activate = useCallback(async () => {
    if (!connected) {
      setError("Connecte ton wallet d'abord.");
      return;
    }
    if (!txSig.trim()) {
      setError("Subscribe d'abord (etape A) ou colle un txSig.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const guestRes = await fetch(`${GATEWAY_URL}/v1/txline/guest`, { method: "POST" });
      if (!guestRes.ok) throw new Error("guest JWT failed");
      const { token: jwt } = (await guestRes.json()) as { token: string };
      const leagues: number[] = [];
      const messageString = `${txSig.trim()}:${leagues.join(",")}:${jwt}`;
      const message = new TextEncoder().encode(messageString);
      const signature = await connected.signMessage(message);
      const walletSignature = bytesToBase64(signature);
      const actRes = await fetch(`${GATEWAY_URL}/v1/txline/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txSig: txSig.trim(),
          walletSignature,
          leagues,
          guestJwt: jwt,
        }),
      });
      const raw = await actRes.text();
      if (!actRes.ok) {
        let message = raw || "activate_failed";
        try {
          const errJson = JSON.parse(raw) as { message?: string; error?: string };
          message = errJson.message ?? errJson.error ?? message;
        } catch {
          // plain text error from gateway
        }
        throw new Error(message);
      }
      let token = raw.trim();
      if (token.startsWith("{")) {
        try {
          const data = JSON.parse(token) as { token?: string };
          token = data.token ?? token;
        } catch {
          // keep raw
        }
      }
      setApiToken(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation echouee");
    } finally {
      setBusy(false);
    }
  }, [connected, txSig]);

  return (
    <div className="glass-panel space-y-6 p-6">
      {wallets.length > 1 && (
        <label className="block text-xs text-white/60">
          Wallet
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={selectedWalletId || wallets[0]?.id}
            onChange={(e) => setSelectedWalletId(e.target.value)}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={connect}
        className="w-full rounded-xl bg-natt-gold px-4 py-3 font-semibold text-black disabled:opacity-60"
      >
        {busy
          ? "Connexion..."
          : connected
            ? `${connected.name}: ${connected.address.slice(0, 8)}...`
            : "Connecter wallet Solana"}
      </button>

      {wallets.length > 0 && !connected && (
        <p className="text-xs text-white/50">
          Detectes : {wallets.map((w) => w.label).join(", ")}
        </p>
      )}

      <div className="space-y-3 text-sm text-white/80">
        <p>
          <strong className="text-white">Etape A — Subscribe gratuit (WC tier 12)</strong>
          <br />
          Signe la transaction on-chain dans ton wallet. Gratuit cote TxLINE — mais il faut{" "}
          <strong className="text-amber-200">~0.01 SOL</strong> sur ce wallet pour les frais
          reseau Solana (creation compte token + tx).
        </p>
        <button
          type="button"
          disabled={busy || !connected}
          onClick={runSubscribe}
          className="w-full rounded-xl border border-natt-gold/50 px-4 py-2 font-medium text-natt-gold disabled:opacity-40"
        >
          {busy ? "Signature..." : "Subscribe on-chain (dans le wallet)"}
        </button>
        <p>
          <strong className="text-white">Etape B — Activer API</strong>
          <br />
          Signe le message d activation avec le meme wallet.
        </p>
      </div>

      <label className="block text-xs text-white/60">
        Transaction signature (txSig) — rempli auto apres etape A
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder="5x..."
          value={txSig}
          onChange={(e) => setTxSig(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={busy || !connected}
        onClick={activate}
        className="w-full rounded-xl bg-natt-cyan px-4 py-3 font-semibold text-black disabled:opacity-40"
      >
        {busy ? "Signature..." : "Activer token API"}
      </button>

      {apiToken && (
        <div className="space-y-2">
          <p className="text-sm text-emerald-300">
            Colle dans <code>TXLINE_API_TOKEN</code> sur le VPS (
            <code>~/HYPERNATT/.env.natt_pundit</code>) puis rebuild gateway :
          </p>
          <textarea
            readOnly
            className="h-32 w-full rounded-lg bg-black/40 p-3 text-xs text-natt-cyan"
            value={apiToken}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {wallets.length === 0 && (
        <p className="text-xs text-amber-300">
          Aucun provider Solana detecte. Installe{" "}
          <a className="underline" href="https://phantom.app/" target="_blank" rel="noreferrer">
            Phantom
          </a>{" "}
          ou active le reseau Solana dans MetaMask, puis rafraichis cette page.
        </p>
      )}

      <p className="text-xs text-white/50">
        <a
          className="text-natt-cyan underline"
          href="https://txline.txodds.com/documentation/worldcup"
          target="_blank"
          rel="noreferrer"
        >
          Doc officielle World Cup Free Tier
        </a>
      </p>
    </div>
  );
}
