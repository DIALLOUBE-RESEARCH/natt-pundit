import { describe, expect, it } from "vitest";
import {
  consensusFromOdds,
  fairProbForSelection,
  minuteFromKickoff,
  selectionRawImplied,
} from "./consensus.js";

const ts = "2026-06-30T12:00:00Z";

const lines1x2 = [
  {
    fixtureId: "wc-1",
    market: "1X2",
    selection: "home",
    implied: 0.35,
    openImplied: 0.32,
    ts,
  },
  {
    fixtureId: "wc-1",
    market: "1X2",
    selection: "draw",
    implied: 0.28,
    openImplied: 0.29,
    ts,
  },
  {
    fixtureId: "wc-1",
    market: "1X2",
    selection: "away",
    implied: 0.37,
    openImplied: 0.39,
    ts,
  },
];

describe("consensus", () => {
  it("shin_1x2_returns_pi_tx", () => {
    const c = consensusFromOdds(lines1x2, ts);
    expect(c).not.toBeNull();
    expect(c!.piTx).toBeGreaterThan(0);
    expect(c!.piTx).toBeLessThan(1);
    expect(c!.home + (c!.draw ?? 0) + c!.away).toBeCloseTo(1, 5);
  });

  it("selectionRawImplied returns raw book side", () => {
    const consensus = consensusFromOdds(lines1x2, ts)!;
    const raw = selectionRawImplied(lines1x2, consensus.selection);
    expect(raw).toBeGreaterThan(0);
    expect(raw).toBeLessThan(1);
  });

  it("minute_from_kickoff_caps_0_120", () => {
    const kickoff = "2026-06-30T12:00:00Z";
    const at45 = new Date("2026-06-30T12:45:00Z");
    expect(minuteFromKickoff(kickoff, at45)).toBe(45);
    const at150 = new Date("2026-06-30T14:30:00Z");
    expect(minuteFromKickoff(kickoff, at150)).toBe(120);
    const before = new Date("2026-06-30T11:00:00Z");
    expect(minuteFromKickoff(kickoff, before)).toBe(0);
  });

  it("fairProbForSelection matches consensus argmax prob (T7)", () => {
    const c = consensusFromOdds(lines1x2, ts)!;
    const fair = fairProbForSelection(lines1x2, c.selection);
    expect(fair).not.toBeNull();
    expect(fair!).toBeCloseTo(c.piTx, 9);
  });

  it("fairProbForSelection: three outcomes are Shin-devigged and sum to 1", () => {
    const h = fairProbForSelection(lines1x2, "home")!;
    const d = fairProbForSelection(lines1x2, "draw")!;
    const a = fairProbForSelection(lines1x2, "away")!;
    expect(h + d + a).toBeCloseTo(1, 6);
    for (const p of [h, d, a]) {
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
  });

  it("fairProbForSelection returns null when a side is missing", () => {
    const onlyHome = [{ selection: "home", implied: 0.5 }];
    expect(fairProbForSelection(onlyHome, "home")).toBeNull();
  });

  it("fairProbForSelection: draw null on a 2-way market", () => {
    const twoWay = [
      { selection: "home", implied: 0.55 },
      { selection: "away", implied: 0.5 },
    ];
    expect(fairProbForSelection(twoWay, "draw")).toBeNull();
    expect(fairProbForSelection(twoWay, "home")).not.toBeNull();
  });

  it("consensusFromOdds ignores non-1X2 markets (AH/OU would corrupt) (T8)", () => {
    const mixed = [
      ...lines1x2,
      { fixtureId: "wc-1", market: "AH", selection: "home", implied: 0.92, ts },
      { fixtureId: "wc-1", market: "OU", selection: "over", implied: 0.5, ts },
    ];
    const clean = consensusFromOdds(lines1x2, ts)!;
    const c = consensusFromOdds(mixed, ts)!;
    expect(c.piTx).toBeCloseTo(clean.piTx, 9);
    expect(c.home).toBeCloseTo(clean.home, 9);
    expect(c.away).toBeCloseTo(clean.away, 9);
  });

  it("consensusFromOdds null when only non-1X2 markets present (T8)", () => {
    const ouOnly = [
      { fixtureId: "wc-1", market: "OU", selection: "over", implied: 0.5, ts },
      { fixtureId: "wc-1", market: "OU", selection: "under", implied: 0.5, ts },
    ];
    expect(consensusFromOdds(ouOnly, ts)).toBeNull();
  });

  it("fairProbForSelection ignores AH lines (T8)", () => {
    const mixed = [
      { selection: "home", implied: 0.35, market: "1X2" },
      { selection: "draw", implied: 0.28, market: "1X2" },
      { selection: "away", implied: 0.37, market: "1X2" },
      { selection: "home", implied: 0.95, market: "AH" },
    ];
    const clean = fairProbForSelection(mixed.filter((l) => l.market === "1X2"), "home")!;
    expect(fairProbForSelection(mixed, "home")!).toBeCloseTo(clean, 9);
  });
});
