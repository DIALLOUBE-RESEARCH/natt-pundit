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

  /** Canada 0-3 Morocco (fixture 18185036) — home stat 0 sentinel path; away stat anchors eventStatRoot. */
  it("dual_stat_zero_home_away_decisive", () => {
    const eventStatRoot = "a73fd42ace288362ea7fdd51d363352b91de85c7160e87652781d27df5ced260";
    const summarySubTreeRoot = "2f88e886b02f90ee2a7e9f117412d52e09c1ee7787c7d164beefa99eb40c5f52";
    const merkleRoot = "2303b870b6d1108a26ffbe8b44c87108ea7cfc648a2fdfe58add6208b1c89c80";
    const result = verifyTxlineSettlementProof({
      statToProve: { key: 1, value: 0, period: 100 },
      statToProve2: { key: 2, value: 3, period: 100 },
      eventStatRoot: hashToBytes(eventStatRoot),
      statProof: nodes([
        { hash: "01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", isRightSibling: false },
        { hash: "31b3b339ffffffff000000000000000000000000000000000000000000000000", isRightSibling: false },
      ]),
      statProof2: nodes([
        { hash: "128fa70454000a2b3e795ed7346c15908b981af20543988f6b84e15711d67508", isRightSibling: true },
        { hash: "956e3dca3518c619511dc315f92dfee5538709bd2096a64fb038418135e58408", isRightSibling: true },
        { hash: "af8023a01a33e4bcf44fe0546f9629244c42ed8559fee46021510979e9a05c62", isRightSibling: true },
        { hash: "060f9336fddcd517fe632b06381499ad213d11cf38c14eed59d4b236503466ae", isRightSibling: true },
      ]),
      subTreeProof: nodes([
        { hash: "d0771f8a17185f6acb2529a59c217e40bed21a5695ead8f9477de2d3a57112cf", isRightSibling: false },
      ]),
      mainTreeProof: nodes([
        { hash: merkleRoot, isRightSibling: false },
      ]),
      summarySubTreeRoot: hashToBytes(summarySubTreeRoot),
      merkleRoot: hashToBytes(merkleRoot),
    });
    expect(result.valid).toBe(true);
  });

  /** France 2-0 Morocco (fixture 18209181) — away 0 uses sentinel; home proof anchors eventStatRoot. */
  it("france_2_0_zero_away_skips_stat2_mismatch", () => {
    const eventStatRoot = "992ccd6ed04161504f123430f51a72de50542af26055308ef17730be96607c73";
    const result = verifyTxlineSettlementProof({
      statToProve: { key: 1, value: 2, period: 0 },
      statToProve2: { key: 2, value: 0, period: 0 },
      eventStatRoot: hashToBytes(eventStatRoot),
      statProof: nodes([
        { hash: "0669eaeb201791aa614b4ab42c2ca0be78ab01dd5f5017f4dbfd98377ab9537d", isRightSibling: true },
        { hash: "89834e88f0986dbad789bb7db1ee65f7f2cb7cceee3ac68caf50c9f0a6ab55e2", isRightSibling: true },
        { hash: "5c431b6330d7616f9a0ffd1a1dd1feda38c8bef5d5cbb010a809cc708bd888ad", isRightSibling: true },
        { hash: "978745d3fbf594b991038a81b854fd1035bf992b393a35d516555f15203e9465", isRightSibling: true },
      ]),
      statProof2: nodes([
        { hash: "01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", isRightSibling: false },
        { hash: "363f3f36ffffffff000000000000000000000000000000000000000000000000", isRightSibling: false },
      ]),
      subTreeProof: nodes(FIXTURE_18172280.subTreeProof),
      mainTreeProof: nodes(FIXTURE_18172280.mainTreeProof),
      summarySubTreeRoot: hashToBytes(FIXTURE_18172280.summarySubTreeRoot),
      merkleRoot: hashToBytes(FIXTURE_18172280.merkleRoot),
    });
    expect(result.reason).not.toBe("stat2_proof_mismatch");
    expect(result.reason).not.toBe("stat_proof_mismatch");
  });
});
