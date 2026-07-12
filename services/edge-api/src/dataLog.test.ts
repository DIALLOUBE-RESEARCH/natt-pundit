import { describe, expect, it } from "vitest";
import type { EdgeSummaryItem, OddsLine, SettlementProof } from "@natt-pundit/contracts";
import {
  buildClvSamples,
  buildClvSamplesFromOdds,
  compactOdds,
  mergeOddsLines,
  stabilize1x2Lines,
  homeImplied1x2,
  type EdgeRecord,
  type FairForFn,
  type OddsRecord,
  edgeRecord,
  edgeSignature,
  impliedToDecimal,
  latencyRecord,
  oddsSignature,
  proofRecord,
  proofSignature,
  scoreTotal,
  scoresSignature,
  shouldLog,
  tickKey,
  tickRecords,
  tickSignature,
} from "./dataLog.js";

function odd(market: string, selection: string, implied: number): OddsLine {
  return { fixtureId: "1", market, selection, implied, ts: "2026-07-01T00:00:00.000Z" };
}

function item(partial: Partial<EdgeSummaryItem>): EdgeSummaryItem {
  return {
    fixtureId: "1",
    verdict: "HOLD",
    edge_score: 0,
    pi_tx: 0.5,
    pi_model: 0.5,
    c: 0.5,
    hasOdds: true,
    ...partial,
  };
}

function proof(partial: Partial<SettlementProof>): SettlementProof {
  return {
    fixtureId: "1",
    merkleRoot: "0xroot",
    leafHash: "0xleaf",
    proof: ["0xa"],
    statType: "stat_1",
    statValue: "1",
    validated: true,
    source: "txline",
    chain: "solana",
    ts: "2026-07-01T00:00:00.000Z",
    ...partial,
  };
}

describe("dataLog helpers", () => {
  it("compactOdds is deterministic regardless of input order", () => {
    const a = compactOdds([odd("1X2", "away", 0.3), odd("1X2", "home", 0.5)]);
    const b = compactOdds([odd("1X2", "home", 0.5), odd("1X2", "away", 0.3)]);
    expect(a).toEqual(b);
    expect(a[0].selection).toBe("away");
  });

  it("oddsSignature changes when an implied changes, stable otherwise", () => {
    const base = [odd("1X2", "home", 0.5)];
    expect(oddsSignature(base)).toBe(oddsSignature([odd("1X2", "home", 0.5)]));
    expect(oddsSignature(base)).not.toBe(oddsSignature([odd("1X2", "home", 0.6)]));
  });

  it("scoresSignature reflects status/score/clock", () => {
    const s1 = scoresSignature(item({ status: "live", score: { home: 1, away: 0 }, clock: { phase: "2H", minute: 60, running: true } }));
    const s2 = scoresSignature(item({ status: "live", score: { home: 1, away: 1 }, clock: { phase: "2H", minute: 60, running: true } }));
    expect(s1).not.toBe(s2);
  });

  it("edgeSignature rounds edge_score to 3 dp for dedup", () => {
    const s1 = edgeSignature(item({ verdict: "SETUP", edge_score: 0.13641 }));
    const s2 = edgeSignature(item({ verdict: "SETUP", edge_score: 0.13649 }));
    expect(s1).toBe(s2); // both round to 0.136
    const s3 = edgeSignature(item({ verdict: "SETUP", edge_score: 0.138 }));
    expect(s1).not.toBe(s3);
  });

  it("proofSignature is unique per (seq, merkleRoot)", () => {
    expect(proofSignature(proof({ seq: 3, merkleRoot: "0xaaa" }))).toBe(proofSignature(proof({ seq: 3, merkleRoot: "0xaaa" })));
    expect(proofSignature(proof({ seq: 3, merkleRoot: "0xaaa" }))).not.toBe(proofSignature(proof({ seq: 4, merkleRoot: "0xaaa" })));
  });

  it("shouldLog only when signature differs", () => {
    expect(shouldLog(undefined, "x")).toBe(true);
    expect(shouldLog("x", "x")).toBe(false);
    expect(shouldLog("x", "y")).toBe(true);
  });

  it("records carry ts + fixtureId (contract)", () => {
    const er = edgeRecord("2026-07-01T00:00:00.000Z", item({ verdict: "SETUP", edge_score: 0.2 }));
    expect(er.ts).toBeTruthy();
    expect(er.fixtureId).toBe("1");
    const pr = proofRecord("2026-07-01T00:00:00.000Z", proof({ seq: 1 }));
    expect(pr.merkleRoot).toBe("0xroot");
    expect(pr.validated).toBe(true);
  });

  it("edgeRecord stamps the current formula version (T7)", () => {
    const er = edgeRecord("2026-07-01T00:00:00.000Z", item({ verdict: "SETUP", edge_score: 0.2 }));
    expect(er.formulaVersion).toBe("f70n_v2");
  });

  it("property: shouldLog never logs identical consecutive signatures", () => {
    for (let i = 0; i < 500; i += 1) {
      const sig = Math.random().toString(36).slice(2);
      expect(shouldLog(sig, sig)).toBe(false);
      const other = `${sig}!`;
      expect(shouldLog(sig, other)).toBe(true);
    }
  });

  it("property: compactOdds output is sorted for random inputs", () => {
    for (let i = 0; i < 200; i += 1) {
      const n = 1 + Math.floor(Math.random() * 6);
      const lines: OddsLine[] = [];
      for (let k = 0; k < n; k += 1) {
        lines.push(odd(`m${Math.floor(Math.random() * 3)}`, `s${Math.floor(Math.random() * 3)}`, Math.random()));
      }
      const out = compactOdds(lines);
      for (let k = 1; k < out.length; k += 1) {
        const prev = out[k - 1];
        const cur = out[k];
        const cmp = prev.market === cur.market ? prev.selection.localeCompare(cur.selection) : prev.market.localeCompare(cur.market);
        expect(cmp <= 0).toBe(true);
      }
    }
  });
});

describe("perishable data helpers (F70N T1)", () => {
  it("impliedToDecimal inverts implied, guards invalid input", () => {
    expect(impliedToDecimal(0.5)).toBe(2);
    expect(impliedToDecimal(0.25)).toBe(4);
    expect(impliedToDecimal(0)).toBe(0);
    expect(impliedToDecimal(-0.1)).toBe(0);
  });

  it("tickKey is unique per (fixture, market, selection)", () => {
    expect(tickKey("1", "1X2", "home")).toBe("1|1X2|home");
    expect(tickKey("1", "1X2", "home")).not.toBe(tickKey("1", "1X2", "away"));
  });

  it("tickSignature dedups on rounded implied (4dp)", () => {
    expect(tickSignature(0.50001)).toBe(tickSignature(0.50002));
    expect(tickSignature(0.5)).not.toBe(tickSignature(0.51));
  });

  it("tickRecords emits one record per selection with decimal", () => {
    const recs = tickRecords("2026-07-01T00:00:00.000Z", "1", [
      odd("1X2", "home", 0.5),
      odd("1X2", "away", 0.25),
    ]);
    expect(recs).toHaveLength(2);
    const home = recs.find((r) => r.selection === "home");
    expect(home?.decimal).toBe(2);
    expect(home?.fixtureId).toBe("1");
    expect(recs.every((r) => r.ts === "2026-07-01T00:00:00.000Z")).toBe(true);
  });

  it("scoreTotal sums goals, 0 when absent", () => {
    expect(scoreTotal(item({ score: { home: 2, away: 1 } }))).toBe(3);
    expect(scoreTotal(item({}))).toBe(0);
  });

  it("latencyRecord computes non-negative ms between event and reaction", () => {
    const rec = latencyRecord(
      "2026-07-01T00:01:00.000Z",
      "1",
      "goal",
      "2026-07-01T00:00:00.000Z",
      "2026-07-01T00:01:00.000Z",
    );
    expect(rec.latencyMs).toBe(60_000);
    expect(rec.eventType).toBe("goal");
    // reaction before event must clamp to 0, never negative.
    const clamped = latencyRecord("t", "1", "goal", "2026-07-01T00:01:00.000Z", "2026-07-01T00:00:00.000Z");
    expect(clamped.latencyMs).toBe(0);
  });
});

describe("buildClvSamples (F70N T2)", () => {
  function erec(partial: Partial<EdgeRecord> & { ts: string }): EdgeRecord {
    return {
      fixtureId: "1",
      verdict: "HOLD",
      edge_score: 0,
      pi_tx: 0.5,
      pi_model: 0.5,
      c: 0.5,
      direction: "none",
      ...partial,
    };
  }

  it("entry = first candidate pick, close = last pi_tx of same direction", () => {
    const samples = buildClvSamples([
      erec({ ts: "2026-07-01T00:00:00.000Z", verdict: "HOLD" }),
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "home", pi_tx: 0.5 }),
      erec({ ts: "2026-07-01T00:30:00.000Z", verdict: "SETUP", direction: "home", pi_tx: 0.6 }),
    ]);
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ fixtureId: "1", direction: "home", fairEntry: 0.5, fairClose: 0.6 });
  });

  it("skips fixtures without a directional candidate", () => {
    const samples = buildClvSamples([
      erec({ ts: "2026-07-01T00:00:00.000Z", verdict: "HOLD" }),
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "none" }),
    ]);
    expect(samples).toHaveLength(0);
  });

  it("skips when entry and close share the same timestamp (no movement window)", () => {
    const samples = buildClvSamples([
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "away", pi_tx: 0.4 }),
    ]);
    expect(samples).toHaveLength(0);
  });

  it("separates samples per fixture", () => {
    const samples = buildClvSamples([
      erec({ ts: "2026-07-01T00:00:00.000Z", fixtureId: "1", verdict: "SETUP", direction: "home", pi_tx: 0.5 }),
      erec({ ts: "2026-07-01T00:10:00.000Z", fixtureId: "1", verdict: "SETUP", direction: "home", pi_tx: 0.55 }),
      erec({ ts: "2026-07-01T00:00:00.000Z", fixtureId: "2", verdict: "SETUP", direction: "away", pi_tx: 0.3 }),
      erec({ ts: "2026-07-01T00:10:00.000Z", fixtureId: "2", verdict: "SETUP", direction: "away", pi_tx: 0.25 }),
    ]);
    expect(samples).toHaveLength(2);
    expect(samples.find((s) => s.fixtureId === "2")?.fairClose).toBe(0.25);
  });
});

describe("buildClvSamplesFromOdds (F70N T7 — honest CLV)", () => {
  function erec(partial: Partial<EdgeRecord> & { ts: string }): EdgeRecord {
    return {
      fixtureId: "1",
      verdict: "HOLD",
      edge_score: 0,
      pi_tx: 0.5,
      pi_model: 0.5,
      c: 0.5,
      direction: "none",
      formulaVersion: "f70n_v2",
      ...partial,
    };
  }
  function orec(ts: string, fixtureId: string, lines: OddsRecord["lines"]): OddsRecord {
    return { ts, fixtureId, lines };
  }
  // Test double: fair prob = the raw implied of that selection (Shin math is
  // covered in natt-core). Exercises the reconstruction plumbing only.
  const fairFor: FairForFn = (lines, sel) =>
    lines.find((l) => l.selection === sel)?.implied ?? null;

  const v2 = { formulaVersion: "f70n_v2" as const };

  it("entry = first clean setup; fairEntry from first odds after flag, close from last odds", () => {
    const edge = [
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "home", edge_score: 0.05 }),
    ];
    const odds = [
      orec("2026-07-01T00:05:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.4 }]),
      orec("2026-07-01T00:30:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.55 }]),
    ];
    const samples = buildClvSamplesFromOdds(edge, odds, fairFor, v2);
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ fixtureId: "1", direction: "home", fairEntry: 0.4, fairClose: 0.55 });
  });

  it("drops records without the matching formula version (contamination guard)", () => {
    const edge = [
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "home", edge_score: 0.05, formulaVersion: undefined }),
    ];
    const odds = [
      orec("2026-07-01T00:05:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.4 }]),
      orec("2026-07-01T00:30:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.55 }]),
    ];
    expect(buildClvSamplesFromOdds(edge, odds, fairFor, v2)).toHaveLength(0);
  });

  it("requires edge_score strictly above minEdge", () => {
    const edge = [
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "home", edge_score: 0.02 }),
    ];
    const odds = [
      orec("2026-07-01T00:05:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.4 }]),
      orec("2026-07-01T00:30:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.55 }]),
    ];
    expect(buildClvSamplesFromOdds(edge, odds, fairFor, { formulaVersion: "f70n_v2", minEdge: 0.03 })).toHaveLength(0);
  });

  it("skips when there is no odds movement window after entry", () => {
    const edge = [
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "home", edge_score: 0.05 }),
    ];
    const odds = [orec("2026-07-01T00:05:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.4 }])];
    expect(buildClvSamplesFromOdds(edge, odds, fairFor, v2)).toHaveLength(0);
  });

  it("skips when the market lacks the picked side at close", () => {
    const edge = [
      erec({ ts: "2026-07-01T00:05:00.000Z", verdict: "SETUP", direction: "home", edge_score: 0.05 }),
    ];
    const odds = [
      orec("2026-07-01T00:05:00.000Z", "1", [{ market: "1X2", selection: "home", implied: 0.4 }]),
      orec("2026-07-01T00:30:00.000Z", "1", [{ market: "1X2", selection: "away", implied: 0.6 }]),
    ];
    expect(buildClvSamplesFromOdds(edge, odds, fairFor, v2)).toHaveLength(0);
  });
});

describe("mergeOddsLines (F70N T8 — anti-flicker carry-forward)", () => {
  it("keeps last known 1X2 when the next tick has only OU", () => {
    const prev = [odd("1X2", "home", 0.5), odd("1X2", "draw", 0.2), odd("1X2", "away", 0.3)];
    const next = [odd("OU", "over", 0.55), odd("OU", "under", 0.45)];
    const merged = mergeOddsLines(prev, next);
    expect(merged.filter((l) => l.market === "1X2")).toHaveLength(3);
    expect(merged.filter((l) => l.market === "OU")).toHaveLength(2);
  });

  it("next overrides the same market+selection", () => {
    const merged = mergeOddsLines([odd("1X2", "home", 0.5)], [odd("1X2", "home", 0.62)]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.implied).toBe(0.62);
  });

  it("is a no-op union when markets are disjoint", () => {
    const merged = mergeOddsLines([odd("1X2", "home", 0.5)], [odd("AH", "home", 0.9)]);
    expect(merged).toHaveLength(2);
  });
});

describe("stabilize1x2Lines (F70N T9 — volatile feed)", () => {
  const stable = [
    odd("1X2", "home", 0.534),
    odd("1X2", "draw", 0.388),
    odd("1X2", "away", 0.078),
  ];

  it("rejects a >12pp home jump and keeps the stable 1X2", () => {
    const incoming = [
      odd("1X2", "home", 0.754),
      odd("1X2", "draw", 0.181),
      odd("1X2", "away", 0.065),
      odd("OU", "over", 0.45),
    ];
    const { lines, accepted } = stabilize1x2Lines(stable, incoming, 0.12);
    expect(accepted).toBe(false);
    expect(homeImplied1x2(lines)).toBeCloseTo(0.534, 3);
    expect(lines.some((l) => l.market === "OU")).toBe(true);
  });

  it("accepts a small home move", () => {
    const incoming = [
      odd("1X2", "home", 0.545),
      odd("1X2", "draw", 0.38),
      odd("1X2", "away", 0.075),
    ];
    const { lines, accepted } = stabilize1x2Lines(stable, incoming, 0.12);
    expect(accepted).toBe(true);
    expect(homeImplied1x2(lines)).toBeCloseTo(0.545, 3);
  });
});
