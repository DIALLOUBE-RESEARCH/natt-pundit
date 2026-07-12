"use client";

import { useCallback, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import { GATEWAY_URL } from "@/lib/api";
import { shell } from "@/lib/appShellI18n";
import { bytesToBase64, type ConnectedWallet } from "@/lib/solanaWallet";
import { subscribeWcFreeTier } from "@/lib/txlineSubscribe";
import type { ReactNode } from "react";

type Props = {
  connected: ConnectedWallet | null;
  walletSlot: ReactNode;
};

export function ActivateTxlineForm({ connected, walletSlot }: Props) {
  const { lang } = usePresent();
  const s = shell(lang);
  const [txSig, setTxSig] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const runSubscribe = useCallback(async () => {
    if (!connected) {
      setError(s.connectWalletFirst);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const sig = await subscribeWcFreeTier(connected);
      setTxSig(sig);
    } catch (e) {
      setError(e instanceof Error ? e.message : s.subscribeOnChain);
    } finally {
      setBusy(false);
    }
  }, [connected, s.connectWalletFirst, s.subscribeOnChain]);

  const activate = useCallback(async () => {
    if (!connected) {
      setError(s.connectWalletFirst);
      return;
    }
    if (!txSig.trim()) {
      setError(s.runSubscribeFirst);
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
          // plain text
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
      setError(e instanceof Error ? e.message : s.activateApiToken);
    } finally {
      setBusy(false);
    }
  }, [connected, txSig, s.activateApiToken, s.connectWalletFirst, s.runSubscribeFirst]);

  return (
    <div className="glass-panel space-y-6 p-6">
      {walletSlot}

      <div className="space-y-3 text-sm text-white/80">
        <p>
          <strong className="text-white">{s.activateStepATitle}</strong>
          <br />
          {s.activateStepABody}
        </p>
        <button
          type="button"
          disabled={busy || !connected}
          onClick={runSubscribe}
          className="w-full rounded-xl border border-natt-gold/50 px-4 py-2 font-medium text-natt-gold disabled:opacity-40"
        >
          {busy ? s.signing : s.subscribeOnChain}
        </button>
        <p>
          <strong className="text-white">{s.activateStepBTitle}</strong>
          <br />
          {s.activateStepBBody}
        </p>
      </div>

      <label className="block text-xs text-white/60">
        {s.txSigLabel}
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder={s.txSigPlaceholder}
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
        {busy ? s.signing : s.activateApiToken}
      </button>

      {apiToken && (
        <div className="space-y-2">
          <p className="text-sm text-emerald-300">{s.pasteTokenHint}</p>
          <textarea
            readOnly
            className="h-32 w-full rounded-lg bg-black/40 p-3 text-xs text-natt-cyan"
            value={apiToken}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="text-xs text-white/50">
        <a
          className="text-natt-cyan underline"
          href="https://txline.txodds.com/documentation/worldcup"
          target="_blank"
          rel="noreferrer"
        >
          {s.officialWcDocs}
        </a>
      </p>
    </div>
  );
}
