import { describe, expect, it } from "vitest";
import { mergeScoreRows } from "./scoreStore.js";
import type { TxlineScoreRow } from "./txlineMap.js";

describe("scoreStore", () => {
  it("merges_snapshot_with_previous_rows", () => {
    const prev: TxlineScoreRow[] = [
      { FixtureId: 1, Ts: 100, Action: "goal", Participant: 2, Clock: { Running: true, Seconds: 780 } },
    ];
    const snap: TxlineScoreRow[] = [
      { FixtureId: 1, Ts: 200, Action: "goal", Participant: 1, Clock: { Running: true, Seconds: 3000 } },
    ];
    const merged = mergeScoreRows("1", snap, prev, 999_999);
    expect(merged).toHaveLength(2);
    expect(merged[0]!.Ts).toBe(100);
    expect(merged[1]!.Ts).toBe(200);
  });

  it("dedupes_by_seq", () => {
    const prev: TxlineScoreRow[] = [
      { FixtureId: 1, Ts: 100, Seq: 1, Action: "penalty_outcome", Participant: 1 },
    ];
    const snap: TxlineScoreRow[] = [
      { FixtureId: 1, Ts: 100, Seq: 1, Action: "penalty_outcome", Participant: 1 },
      { FixtureId: 1, Ts: 200, Seq: 2, Action: "penalty_outcome", Participant: 2 },
    ];
    const merged = mergeScoreRows("1", snap, prev, 999_999);
    expect(merged).toHaveLength(2);
  });
});
