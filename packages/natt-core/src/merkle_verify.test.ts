import { describe, expect, it } from "vitest";
import {
  bytesToHex,
  computeMerkleRoot,
  hashToBytes,
  merkleParent,
  scoreStatLeafHash,
  verifyMerklePath,
  verifyTxlineSettlementProof,
  type MerkleProofNode,
} from "./merkle_verify.js";

/** Prod fixture 18172280 — TxLINE stat-validation (2026-06-30 VPS). */
const FIXTURE_18172280 = {
  statToProve: { key: 1002, value: 0, period: 0 },
  eventStatRoot: "5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861",
  summarySubTreeRoot: "fc6f76257c0b3aabaf8009133fc40f42a4de513e52e4ba61ac4ab4017abd7231",
  merkleRoot: "698710543ae755ebee2ee545eefacbdf7de69214e873afafd9d8a6a30fce797c",
  statProof: [
    { hash: "cc884eba535f1794cb0432b1851139306813989145306d1a3c543bb1e0f1907b", isRightSibling: false },
    { hash: "9c124e61fc17cd91d02bcbccd869e5f73e121595f980fd681cda151a0683eb69", isRightSibling: true },
    { hash: "feb513c4a48c186b000a7b544997f3b5b512bb1f4cd56e262e453ddb9d31797d", isRightSibling: true },
    { hash: "7e1ebf807ce14b39583e6ddba72a134ef8ee9b1a7a60294b6db5c91bf6b9bc6e", isRightSibling: false },
    { hash: "6928c974da9b1c87bb98d0e746d5d7d46b1a9409156cb71731f16fb3fff91af5", isRightSibling: true },
    { hash: "59e681ca45f796e9d60afec73e0fb3bea38a4607530cd5c8f5b7b47f8028b8a9", isRightSibling: true },
  ],
  subTreeProof: [
    { hash: "5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861", isRightSibling: false },
  ],
  mainTreeProof: [
    { hash: "914ebfe898ff07826d983f207e2a0f1b75cfd9af321e74ef88287855d12f0ada", isRightSibling: false },
    { hash: "698710543ae755ebee2ee545eefacbdf7de69214e873afafd9d8a6a30fce797c", isRightSibling: true },
  ],
};

function nodes(rows: { hash: string; isRightSibling: boolean }[]): MerkleProofNode[] {
  return rows.map((r) => ({ hash: hashToBytes(r.hash), isRightSibling: r.isRightSibling }));
}

describe("merkle_verify", () => {
  it("synthetic_two_level_tree", () => {
    const leafA = hashToBytes("0x" + "11".repeat(32));
    const leafB = hashToBytes("0x" + "22".repeat(32));
    const root = merkleParent(leafA, leafB);
    expect(verifyMerklePath(leafA, [{ hash: leafB, isRightSibling: true }], root)).toBe(true);
    expect(verifyMerklePath(leafB, [{ hash: leafA, isRightSibling: false }], root)).toBe(true);
  });

  it("score_stat_leaf_prod_fixture", () => {
    const leaf = scoreStatLeafHash(1002, 0, 0);
    expect(bytesToHex(leaf)).toBe("0xfd19659b35402703d8c7ceb78cc3b0d8ca7c5b19167c10df041aca2ef99acf4a");
    const eventRoot = hashToBytes(FIXTURE_18172280.eventStatRoot);
    expect(verifyMerklePath(leaf, nodes(FIXTURE_18172280.statProof), eventRoot)).toBe(true);
  });

  it("prod_fixture_subtree_level", () => {
    const eventRoot = hashToBytes(FIXTURE_18172280.eventStatRoot);
    const summaryRoot = hashToBytes(FIXTURE_18172280.summarySubTreeRoot);
    expect(verifyMerklePath(eventRoot, nodes(FIXTURE_18172280.subTreeProof), summaryRoot)).toBe(
      true,
    );
  });

  it("prod_fixture_full_settlement_verify", () => {
    const result = verifyTxlineSettlementProof({
      statToProve: FIXTURE_18172280.statToProve,
      eventStatRoot: hashToBytes(FIXTURE_18172280.eventStatRoot),
      statProof: nodes(FIXTURE_18172280.statProof),
      subTreeProof: nodes(FIXTURE_18172280.subTreeProof),
      mainTreeProof: nodes(FIXTURE_18172280.mainTreeProof),
      summarySubTreeRoot: hashToBytes(FIXTURE_18172280.summarySubTreeRoot),
      merkleRoot: hashToBytes(FIXTURE_18172280.merkleRoot),
    });
    expect(result.valid).toBe(true);
  });

  it("tampered_proof_fails", () => {
    const leaf = scoreStatLeafHash(1002, 0, 0);
    const badRoot = hashToBytes("0x" + "ff".repeat(32));
    expect(verifyMerklePath(leaf, nodes(FIXTURE_18172280.statProof), badRoot)).toBe(false);
  });

  it("compute_root_matches_walk", () => {
    const leaf = scoreStatLeafHash(1002, 0, 0);
    const proof = nodes(FIXTURE_18172280.statProof);
    const root = hashToBytes(FIXTURE_18172280.eventStatRoot);
    expect(bytesToHex(computeMerkleRoot(leaf, proof))).toBe(bytesToHex(root));
  });
});
