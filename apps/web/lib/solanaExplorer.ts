/** TxLINE on-chain program (Solana mainnet) — anchors settlement Merkle roots. */
export const TXLINE_PROGRAM_ID = "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA";

export function explorerAddress(programId?: string): string | null {
  const id = programId ?? TXLINE_PROGRAM_ID;
  if (!id) return null;
  return `https://explorer.solana.com/address/${id}`;
}

export function explorerTx(txSig?: string): string | null {
  if (!txSig) return null;
  return `https://explorer.solana.com/tx/${txSig}`;
}

/** Best on-chain link for a settlement proof (tx > program address). */
export function settlementExplorerLink(proof: {
  explorerUrl?: string;
  txSig?: string;
  programId?: string;
}): string | null {
  if (proof.explorerUrl) return proof.explorerUrl;
  const tx = explorerTx(proof.txSig);
  if (tx) return tx;
  return explorerAddress(proof.programId);
}
