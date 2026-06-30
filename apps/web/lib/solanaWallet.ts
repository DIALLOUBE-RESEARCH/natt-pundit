import type { Wallet } from "@wallet-standard/base";
import {
  StandardConnect,
  type StandardConnectFeature,
} from "@wallet-standard/features";
import {
  SolanaSignAndSendTransaction,
  SolanaSignMessage,
  SolanaSignTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignMessageFeature,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import type { Transaction } from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { getSolanaRpcUrl } from "./solanaRpc";

export type ConnectedWallet = {
  name: string;
  address: string;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signAndSendTransaction(tx: Transaction): Promise<string>;
};

type LegacyInjected = {
  publicKey: { toBase58(): string } | null;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signMessage(
    message: Uint8Array,
    display?: string,
  ): Promise<{ signature: Uint8Array } | Uint8Array>;
  signAndSendTransaction(
    transaction: Transaction,
  ): Promise<{ signature: string } | string>;
};

const RPC = getSolanaRpcUrl();

function solanaConnection(): Connection {
  return new Connection(RPC, "confirmed");
}

function asTxSignature(signature: string | Uint8Array): string {
  return typeof signature === "string" ? signature : bs58.encode(signature);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function getLegacyInjected(): LegacyInjected | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    solana?: LegacyInjected & { isPhantom?: boolean };
    phantom?: { solana?: LegacyInjected };
  };
  if (w.solana?.isPhantom) return w.solana;
  if (w.phantom?.solana) return w.phantom.solana;
  return w.solana ?? null;
}

function hasFeature(wallet: Wallet, feature: string): boolean {
  return feature in wallet.features;
}

async function prepareTx(tx: Transaction, payer: string): Promise<Transaction> {
  const connection = solanaConnection();
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(payer);
  return tx;
}

async function connectLegacy(): Promise<ConnectedWallet> {
  const provider = getLegacyInjected();
  if (!provider?.signAndSendTransaction) {
    throw new Error(
      "Phantom non detecte. Installe l extension Phantom ou active Solana dans MetaMask.",
    );
  }
  await provider.connect();
  const address = provider.publicKey?.toBase58();
  if (!address) throw new Error("Wallet sans adresse publique.");

  return {
    name: "Phantom",
    address,
    signMessage: async (message) => {
      const result = await provider.signMessage(message, "utf8");
      if (result instanceof Uint8Array) return result;
      return result.signature;
    },
    signAndSendTransaction: async (tx) => {
      const ready = await prepareTx(tx, address);
      const result = await provider.signAndSendTransaction(ready);
      return typeof result === "string" ? result : result.signature;
    },
  };
}

async function connectWalletStandard(wallet: Wallet): Promise<ConnectedWallet> {
  if (!hasFeature(wallet, StandardConnect) || !hasFeature(wallet, SolanaSignMessage)) {
    throw new Error(`${wallet.name} ne supporte pas Solana.`);
  }

  const connectFeature = wallet.features[StandardConnect] as
    | StandardConnectFeature[typeof StandardConnect]
    | undefined;
  if (!connectFeature) throw new Error(`${wallet.name}: connect indisponible.`);

  const { accounts } = await connectFeature.connect();
  const account = accounts[0];
  if (!account) throw new Error("Aucun compte Solana.");

  const signMessageFeature = wallet.features[SolanaSignMessage] as
    | SolanaSignMessageFeature[typeof SolanaSignMessage]
    | undefined;
  if (!signMessageFeature) throw new Error(`${wallet.name}: signMessage indisponible.`);

  const signAndSendFeature = hasFeature(wallet, SolanaSignAndSendTransaction)
    ? (wallet.features[SolanaSignAndSendTransaction] as
        | SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]
        | undefined)
    : null;
  const signTxFeature = hasFeature(wallet, SolanaSignTransaction)
    ? (wallet.features[SolanaSignTransaction] as
        | SolanaSignTransactionFeature[typeof SolanaSignTransaction]
        | undefined)
    : null;

  return {
    name: wallet.name,
    address: account.address,
    signMessage: async (message) => {
      const [{ signature }] = await signMessageFeature.signMessage({ account, message });
      return signature;
    },
    signAndSendTransaction: async (tx) => {
      const ready = await prepareTx(tx, account.address);
      const serialized = ready.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      if (signAndSendFeature) {
        const [{ signature }] = await signAndSendFeature.signAndSendTransaction({
          account,
          chain: "solana:mainnet",
          transaction: serialized,
        });
        return asTxSignature(signature);
      }

      if (!signTxFeature) {
        throw new Error(`${wallet.name} ne peut pas envoyer de transaction.`);
      }

      const signed = await signTxFeature.signTransaction({
        account,
        transaction: serialized,
      });
      const signedBytes = signed[0]?.signedTransaction;
      if (!(signedBytes instanceof Uint8Array)) {
        throw new Error("Transaction signee invalide.");
      }
      const connection = solanaConnection();
      return connection.sendRawTransaction(signedBytes, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    },
  };
}

export function onWalletsChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWallets } = require("@wallet-standard/app") as typeof import("@wallet-standard/app");
    const api = getWallets();
    const offRegister = api.on("register", cb);
    const offUnregister = api.on("unregister", cb);
    return () => {
      offRegister();
      offUnregister();
    };
  } catch {
    return () => {};
  }
}

export function listAvailableWallets(): Array<{ id: string; label: string }> {
  if (typeof window === "undefined") return [];

  const seen = new Set<string>();
  const out: Array<{ id: string; label: string }> = [];

  if (getLegacyInjected()?.signAndSendTransaction) {
    out.push({ id: "phantom-legacy", label: "Phantom" });
    seen.add("phantom");
  }

  try {
    // Dynamic require avoids SSR crash
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWallets } = require("@wallet-standard/app") as typeof import("@wallet-standard/app");
    for (const wallet of getWallets().get()) {
      if (!hasFeature(wallet, SolanaSignMessage)) continue;
      const key = wallet.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: `ws:${wallet.name}`, label: wallet.name });
    }
  } catch {
    // ignore
  }

  return out;
}

export async function connectSolanaWallet(walletId: string): Promise<ConnectedWallet> {
  if (walletId === "phantom-legacy") {
    return connectLegacy();
  }

  if (walletId.startsWith("ws:")) {
    const name = walletId.slice(3);
    const { getWallets } = await import("@wallet-standard/app");
    const wallet = getWallets().get().find((w) => w.name === name);
    if (!wallet) throw new Error(`Wallet ${name} introuvable.`);
    return connectWalletStandard(wallet);
  }

  throw new Error("Wallet inconnu.");
}
