/** Client-side escrow cluster (mirrors gateway NATT_ESCROW_CLUSTER). */

export type EscrowCluster = "devnet" | "mainnet";

export const TXLINE_DEVNET_PROGRAM_ID = "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J";
export const TXLINE_MAINNET_PROGRAM_ID = "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA";
export const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

export function escrowCluster(): EscrowCluster {
  return process.env.NEXT_PUBLIC_NATT_ESCROW_CLUSTER === "mainnet" ? "mainnet" : "devnet";
}

export function txlineProgramId(cluster: EscrowCluster = escrowCluster()): string {
  return cluster === "devnet" ? TXLINE_DEVNET_PROGRAM_ID : TXLINE_MAINNET_PROGRAM_ID;
}

export function usdcMintAddress(cluster: EscrowCluster = escrowCluster()): string {
  return cluster === "devnet" ? USDC_DEVNET_MINT : USDC_MAINNET_MINT;
}

export function explorerClusterQuery(cluster: EscrowCluster = escrowCluster()): string {
  return cluster === "devnet" ? "?cluster=devnet" : "";
}
