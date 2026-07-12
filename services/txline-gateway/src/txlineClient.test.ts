import { describe, expect, it } from "vitest";
import { parseTxlineSsePayload } from "./txlineClient.js";

describe("txlineClient", () => {
  it("parses_sse_score_updates", () => {
    const text = [
      'data: {"FixtureId":1,"Seq":1,"Action":"goal"}',
      "",
      'data: {"FixtureId":1,"Seq":2,"Action":"penalty_outcome"}',
    ].join("\n");
    const rows = parseTxlineSsePayload<{ Seq: number; Action: string }>(text);
    expect(rows).toHaveLength(2);
    expect(rows[1]?.Action).toBe("penalty_outcome");
  });
});
