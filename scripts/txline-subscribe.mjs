/**
 * TxLINE WC free tier subscribe — run locally once.
 * Requires: Solana CLI wallet or ANCHOR_WALLET path (~/.config/solana/id.json)
 *
 * Usage from hackathon/natt-pundit:
 *   npm run txline:subscribe
 */
import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");
const SERVICE_LEVEL = 12;
const WEEKS = 4;

async function main() {
  const walletPath =
    process.env.ANCHOR_WALLET ?? join(homedir(), ".config", "solana", "id.json");
  const secret = JSON.parse(readFileSync(walletPath, "utf8")) as number[];
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(
    process.env.ANCHOR_PROVIDER_URL ?? "https://api.mainnet-beta.solana.com",
    "confirmed",
  );
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idlPath = new URL("../apps/web/public/txline-idl.json", import.meta.url);
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));
  const program = new anchor.Program(idl, provider);

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
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  console.log("Wallet:", wallet.publicKey.toBase58());
  console.log("Subscribe WC free tier (service level 12)...");

  const txSig = await program.methods
    .subscribe(SERVICE_LEVEL, WEEKS)
    .accounts({
      user: wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: TOKEN_MINT,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction()
    .then(async (subscribeIx) => {
      const tx = new Transaction();
      const ataInfo = await connection.getAccountInfo(userTokenAccount);
      if (!ataInfo) {
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            userTokenAccount,
            wallet.publicKey,
            TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }
      tx.add(subscribeIx);
      return provider.sendAndConfirm(tx);
    });

  console.log("\n=== SUCCESS ===");
  console.log("txSig (colle dans /activate):");
  console.log(txSig);
  console.log("\nPuis ouvre http://localhost:3000/activate pour activer le token API.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
