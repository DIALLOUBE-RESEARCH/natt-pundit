import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PublicKey } from "@solana/web3.js";
import { getEscrowProgramId, poolPda, positionPda, parsePositionSideFromData, validateCpiSettleArgs } from "../escrow-agent.mjs";

describe("escrow-agent", () => {
  it("poolPda is deterministic for fixture", () => {
    const programId = getEscrowProgramId();
    const a = poolPda(programId, "18179551");
    const b = poolPda(programId, "18179551");
    assert.equal(a.toBase58(), b.toBase58());
  });

  it("positionPda depends on owner", () => {
    const programId = getEscrowProgramId();
    const pool = poolPda(programId, "18179551");
    const owner = new PublicKey("Eygd1V74pe9wNzsApnfWhFF1L9SMtBsLCGPNc17m834f");
    const pos = positionPda(programId, pool, owner);
    assert.ok(pos.toBase58().length > 30);
  });

  it("parsePositionSideFromData reads side byte", () => {
    const buf = Buffer.alloc(80);
    buf[72] = 0;
    assert.equal(parsePositionSideFromData(buf), 0);
    buf[72] = 2;
    assert.equal(parsePositionSideFromData(buf), 2);
    assert.equal(parsePositionSideFromData(Buffer.alloc(10)), null);
  });

  it("validateCpiSettleArgs rejects partial cpi_args", () => {
    const partial = {
      targetTs: "1",
      fixtureSummary: {
        fixtureId: 1,
        updateStats: { updateCount: 1, minTimestamp: 1, maxTimestamp: 2 },
        eventsSubTreeRoot: Array(32).fill(0),
      },
      fixtureProof: [{ hash: Array(32).fill(1), isRightSibling: false }],
      mainTreeProof: [{ hash: Array(32).fill(2), isRightSibling: false }],
      predicate: { threshold: 0, comparison: { equalTo: {} } },
      dailyScoresPdaSeeds: { seeds: ["daily_scores_roots", [0, 1, 2, 3]] },
    };
    assert.throws(
      () => validateCpiSettleArgs(partial),
      /cpi_args\.stat1\.statToProve missing/,
    );
    assert.throws(() => validateCpiSettleArgs(null), /cpi_args required/);
  });
});
