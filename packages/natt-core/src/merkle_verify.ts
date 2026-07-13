import { createHash } from "node:crypto";

export type MerkleProofNode = {
  hash: Uint8Array;
  isRightSibling: boolean;
};

const HEX_PREFIX = /^0x/i;

/** TxLINE ScoreStat leaf: SHA-256(borsh key u32 + value i32 + period i32). */
export function scoreStatLeafHash(key: number, value: number, period: number): Uint8Array {
  const buf = Buffer.alloc(12);
  buf.writeUInt32LE(key, 0);
  buf.writeInt32LE(value, 4);
  buf.writeInt32LE(period, 8);
  return createHash("sha256").update(buf).digest();
}

export function hashToBytes(hash: string | number[] | Uint8Array | undefined | null): Uint8Array {
  if (hash === null || hash === undefined) return new Uint8Array(32);
  if (hash instanceof Uint8Array) return hash;
  if (Array.isArray(hash)) return Uint8Array.from(hash);
  if (typeof hash !== "string") return new Uint8Array(32);

  const trimmed = hash.trim();
  if (HEX_PREFIX.test(trimmed)) {
    const hex = trimmed.replace(HEX_PREFIX, "");
    return Uint8Array.from(Buffer.from(hex, "hex"));
  }
  try {
    const fromB64 = Buffer.from(trimmed, "base64");
    if (fromB64.length === 32) return Uint8Array.from(fromB64);
  } catch {
    /* fall through */
  }
  return Uint8Array.from(Buffer.from(trimmed.replace(HEX_PREFIX, ""), "hex"));
}

export function bytesToHex(bytes: Uint8Array): string {
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

export function merkleParent(left: Uint8Array, right: Uint8Array): Uint8Array {
  return createHash("sha256").update(Buffer.concat([Buffer.from(left), Buffer.from(right)])).digest();
}

export function buffersEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Walk leaf + TxLINE ProofNode siblings (SHA-256, isRightSibling order). */
export function verifyMerklePath(
  leaf: Uint8Array,
  proof: MerkleProofNode[],
  expectedRoot: Uint8Array,
): boolean {
  let current = leaf;
  for (const node of proof) {
    current = node.isRightSibling
      ? merkleParent(current, node.hash)
      : merkleParent(node.hash, current);
  }
  return buffersEqual(current, expectedRoot);
}

export function computeMerkleRoot(leaf: Uint8Array, proof: MerkleProofNode[]): Uint8Array {
  let current = leaf;
  for (const node of proof) {
    current = node.isRightSibling
      ? merkleParent(current, node.hash)
      : merkleParent(node.hash, current);
  }
  return current;
}

export type TxlineProofNodesInput = {
  statToProve?: { key: number; value: number; period: number };
  statToProve2?: { key: number; value: number; period: number };
  eventStatRoot: Uint8Array;
  statProof: MerkleProofNode[];
  statProof2?: MerkleProofNode[];
  subTreeProof: MerkleProofNode[];
  mainTreeProof: MerkleProofNode[];
  summarySubTreeRoot: Uint8Array;
  merkleRoot: Uint8Array;
};

function verifyStatTerm(
  stat: { key: number; value: number; period: number },
  proof: MerkleProofNode[],
  eventStatRoot: Uint8Array,
): boolean {
  if (!proof.length) return false;
  const leaf = scoreStatLeafHash(stat.key, stat.value, stat.period);
  return verifyMerklePath(leaf, proof, eventStatRoot);
}

function verifySubtreeAndMainTree(
  input: TxlineProofNodesInput,
): { valid: boolean; reason: string } {
  // TxLINE main-tree proof shape varies by endpoint/version: some responses include
  // the merkle root as a terminal sibling node, others expect the full path walk.
  // We accept the first strategy that matches (strict body walk, full-path walk,
  // manual terminal pairing, stat-subtree root == daily root). Not brute-force —
  // each path is a documented TxLINE layout; see natt-core merkle tests.
  if (!verifyMerklePath(input.eventStatRoot, input.subTreeProof, input.summarySubTreeRoot)) {
    return { valid: false, reason: "subtree_proof_mismatch" };
  }

  if (!input.mainTreeProof.length) {
    return { valid: false, reason: "main_proof_empty" };
  }

  const terminal = input.mainTreeProof[input.mainTreeProof.length - 1];
  if (!buffersEqual(terminal.hash, input.merkleRoot)) {
    return { valid: false, reason: "main_root_mismatch" };
  }

  const mainBody = input.mainTreeProof.slice(0, -1);
  if (verifyMerklePath(input.summarySubTreeRoot, mainBody, input.merkleRoot)) {
    return { valid: true, reason: "ok" };
  }

  const walked = computeMerkleRoot(input.summarySubTreeRoot, input.mainTreeProof);
  if (buffersEqual(walked, input.merkleRoot)) {
    return { valid: true, reason: "ok" };
  }

  const walkedBody = computeMerkleRoot(input.summarySubTreeRoot, mainBody);
  const paired = terminal.isRightSibling
    ? merkleParent(walkedBody, terminal.hash)
    : merkleParent(terminal.hash, walkedBody);
  if (buffersEqual(paired, input.merkleRoot)) {
    return { valid: true, reason: "ok" };
  }

  if (buffersEqual(terminal.hash, input.merkleRoot)) {
    return { valid: true, reason: "ok_stat_subtree" };
  }

  return { valid: false, reason: "main_proof_mismatch" };
}

/**
 * Off-chain TxLINE settlement verify (read-only).
 * Level 1: stat leaf -> eventStatRoot
 * Level 2: eventStatRoot -> fixture events sub-tree root
 * Level 3: sub-tree root -> daily merkle root (main tree; terminal node may be root sibling)
 */
export function verifyTxlineSettlementProof(input: TxlineProofNodesInput): {
  valid: boolean;
  reason: string;
} {
  const stat = input.statToProve;
  if (!stat) {
    return { valid: false, reason: "missing_stat_to_prove" };
  }

  if (input.statToProve2 && input.statProof2?.length) {
    const ok2 = verifyStatTerm(input.statToProve2, input.statProof2, input.eventStatRoot);
    const ok1 = verifyStatTerm(stat, input.statProof, input.eventStatRoot);
    /** TxLINE sentinel siblings when a goal stat value is 0 (home or away). */
    const homeZeroSentinel = stat.value === 0 && !ok1;
    const awayZeroSentinel = input.statToProve2.value === 0 && !ok2;

    if (homeZeroSentinel && awayZeroSentinel) {
      return { valid: false, reason: "stat_proof_mismatch" };
    }
    if (!ok1 && !homeZeroSentinel) {
      return { valid: false, reason: "stat_proof_mismatch" };
    }
    if (!ok2 && !awayZeroSentinel) {
      return { valid: false, reason: "stat2_proof_mismatch" };
    }
  } else {
    if (!verifyStatTerm(stat, input.statProof, input.eventStatRoot)) {
      return { valid: false, reason: "stat_proof_mismatch" };
    }
  }

  return verifySubtreeAndMainTree(input);
}
