/**
 * Escrow cluster config — devnet default for hackathon (no mainnet SOL required).
 */

export type EscrowCluster = "devnet" | "mainnet";

export const TXLINE_MAINNET_PROGRAM_ID = "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA";
export const TXLINE_DEVNET_PROGRAM_ID = "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J";

export const TXLINE_MAINNET_API = "https://txline.txodds.com";
export const TXLINE_DEVNET_API = "https://txline-dev.txodds.com";

/** Circle USDC devnet mint (Solana). */
export const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";
export const SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com";

export function parseEscrowCluster(raw?: string): EscrowCluster {
  return raw?.trim().toLowerCase() === "mainnet" ? "mainnet" : "devnet";
}

export function txlineProgramId(cluster: EscrowCluster): string {
  return cluster === "devnet" ? TXLINE_DEVNET_PROGRAM_ID : TXLINE_MAINNET_PROGRAM_ID;
}

export function txlineApiBase(cluster: EscrowCluster): string {
  return cluster === "devnet" ? TXLINE_DEVNET_API : TXLINE_MAINNET_API;
}

export function usdcMint(cluster: EscrowCluster): string {
  return cluster === "devnet" ? USDC_DEVNET_MINT : USDC_MAINNET_MINT;
}

export function solanaRpcUrl(cluster: EscrowCluster): string {
  return cluster === "devnet" ? SOLANA_DEVNET_RPC : SOLANA_MAINNET_RPC;
}

export function explorerClusterQuery(cluster: EscrowCluster): string {
  return cluster === "devnet" ? "?cluster=devnet" : "";
}
