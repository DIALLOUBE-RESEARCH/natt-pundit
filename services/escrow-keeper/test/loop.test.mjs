import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveOutcomeFromScores, shouldAttemptSettle } from "../loopCore.mjs";

describe("escrow-keeper loop", () => {
  it("resolveOutcomeFromScores group draw", () => {
    assert.equal(
      resolveOutcomeFromScores({ kickoffAt: "2026-06-15T18:00:00Z" }, { score: { home: 1, away: 1 } }),
      "draw",
    );
  });

  it("resolveOutcomeFromScores knockout pens", () => {
    assert.equal(
      resolveOutcomeFromScores(
        { wcFormat: "knockout" },
        { score: { home: 1, away: 1 }, penScore: { home: 4, away: 5 } },
      ),
      "away",
    );
  });

  it("shouldAttemptSettle skips solo side", () => {
    assert.equal(
      shouldAttemptSettle({
        fixtureStatus: "finished",
        pool: { exists: true, settled: false },
        sideTotals: ["1000000", "0", "0"],
      }),
      false,
    );
  });

  it("shouldAttemptSettle accepts parimutuel finished pool", () => {
    assert.equal(
      shouldAttemptSettle({
        fixtureStatus: "finished",
        pool: { exists: true, settled: false },
        sideTotals: ["1000000", "0", "2000000"],
      }),
      true,
    );
  });

  it("shouldAttemptSettle skips already settled pool (idempotent)", () => {
    assert.equal(
      shouldAttemptSettle({
        fixtureStatus: "finished",
        pool: { exists: true, settled: true },
        sideTotals: ["1000000", "0", "2000000"],
      }),
      false,
    );
  });
});
