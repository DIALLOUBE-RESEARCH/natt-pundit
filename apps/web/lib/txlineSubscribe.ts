import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { ConnectedWallet } from "./solanaWallet";
import { getSolanaRpcUrl } from "./solanaRpc";
import txlineIdl from "@/idl/txline.json";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");
const SERVICE_LEVEL = 12;
const WEEKS = 4;
const RPC = getSolanaRpcUrl();
/** Rent ATA Token-2022 + frais tx + marge wallet (~0.003 SOL). */
const MIN_LAMPORTS_NEW_ATA = 3_000_000;
const MIN_LAMPORTS_SUBSCRIBE_ONLY = 500_000;

function solBalanceMessage(lamports: number, address: string, needAta: boolean): string {
  const have = (lamports / 1e9).toFixed(4);
  const min = needAta ? "0.01" : "0.001";
  return (
    `SOL insuffisant (${have} SOL sur ce wallet). ` +
    `Envoie au moins ${min} SOL sur Solana mainnet a ${address.slice(0, 8)}... ` +
    `puis reessaie. (Gratuit cote TxLINE, mais Solana prend des frais reseau.)`
  );
}

function isInsufficientRentError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return "InsufficientFundsForRent" in err;
}

function simulationLooksSuccessful(logs: string): boolean {
  return (
    logs.includes("Subscription successful") ||
    logs.includes("Program 9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA success")
  );
}

/** Subscribe WC free tier — transaction signee dans le navigateur. */
export async function subscribeWcFreeTier(connected: ConnectedWallet): Promise<string> {
  const connection = new Connection(RPC, "confirmed");
  const user = new PublicKey(connected.address);

  const dummyWallet = {
    publicKey: user,
    signTransaction: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
      t: T,
    ) => t,
    signAllTransactions: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
      ts: T[],
    ) => ts,
  } as anchor.Wallet;
  const provider = new anchor.AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });

  const program = new anchor.Program(txlineIdl as anchor.Idl, provider);

  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    PROGRAM_ID,
  );
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    PROGRAM_ID,
  );
  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
  );
  const userTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    user,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  const subscribeIx = await program.methods
    .subscribe(SERVICE_LEVEL, WEEKS)
    .accounts({
      user,
      pricingMatrix: pricingMatrixPda,
      tokenMint: TOKEN_MINT,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction();
  const ataInfo = await connection.getAccountInfo(userTokenAccount);
  const needAta = !ataInfo;
  if (needAta) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        userTokenAccount,
        user,
        TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }
  tx.add(subscribeIx);

  const balance = await connection.getBalance(user);
  const minLamports = needAta ? MIN_LAMPORTS_NEW_ATA : MIN_LAMPORTS_SUBSCRIBE_ONLY;
  if (balance < minLamports) {
    throw new Error(solBalanceMessage(balance, user.toBase58(), needAta));
  }

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = user;

  const sim = await connection.simulateTransaction(tx);
  if (sim.value.err) {
    const logs = (sim.value.logs ?? []).join("\n");
    if (logs.includes("ActiveSubscription") || logs.includes("active subscription")) {
      throw new Error(
        "Deja abonne avec ce wallet. Passe directement a l etape B (colle ton txSig si tu l as).",
      );
    }
    if (isInsufficientRentError(sim.value.err) || simulationLooksSuccessful(logs)) {
      throw new Error(solBalanceMessage(balance, user.toBase58(), needAta));
    }
    if (logs.includes("AccountNotInitialized") && logs.includes("user_token_account")) {
      throw new Error("Compte token TxL manquant — recharge la page et reessaie.");
    }
    throw new Error(`Transaction refusee on-chain: ${JSON.stringify(sim.value.err)}`);
  }

  return connected.signAndSendTransaction(tx);
}
