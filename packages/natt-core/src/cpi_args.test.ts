import { describe, expect, it } from "vitest";
import {
  buildFixtureSummary,
  buildValidateStatArgs,
  dailyScoresPdaSeeds,
  epochDayFromMinTimestamp,
  predicateForOutcome,
  toBytes32,
  toProofNodes,
  type TxlineStatValidationPayload,
} from "./cpi_args.js";

const TWO_STAT_FIXTURE: TxlineStatValidationPayload = {
  summary: {
    fixtureId: 18172280,
    updateStats: {
      updateCount: 12,
      minTimestamp: 1_751_884_800_000,
      maxTimestamp: 1_751_888_400_000,
    },
    eventStatsSubTreeRoot: "fc6f76257c0b3aabaf8009133fc40f42a4de513e52e4ba61ac4ab4017abd7231",
  },
  subTreeProof: [
    { hash: "5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861", isRightSibling: false },
  ],
  mainTreeProof: [
    { hash: "914ebfe898ff07826d983f207e2a0f1b75cfd9af321e74ef88287855d12f0ada", isRightSibling: false },
    { hash: "698710543ae755ebee2ee545eefacbdf7de69214e873afafd9d8a6a30fce797c", isRightSibling: true },
  ],
  statToProve: { key: 1, value: 1, period: 0 },
  statToProve2: { key: 2, value: 0, period: 0 },
  eventStatRoot: "5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861",
  statProof: [
    { hash: "cc884eba535f1794cb0432b1851139306813989145306d1a3c543bb1e0f1907b", isRightSibling: false },
  ],
  statProof2: [
    { hash: "9c124e61fc17cd91d02bcbccd869e5f73e121595f980fd681cda151a0683eb69", isRightSibling: true },
  ],
};

describe("cpi_args", () => {
  it("toBytes32_rejects_short_hash", () => {
    expect(() => toBytes32("0xabcd")).toThrow(/32 bytes/);
  });

  it("toProofNodes_produces_32_byte_hashes", () => {
    const nodes = toProofNodes(TWO_STAT_FIXTURE.subTreeProof);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.hash).toHaveLength(32);
    expect(nodes[0]!.isRightSibling).toBe(false);
  });

  it("epoch_day_matches_txline_doc", () => {
    const minTs = TWO_STAT_FIXTURE.summary!.updateStats!.minTimestamp;
    const epochDay = epochDayFromMinTimestamp(minTs);
    expect(epochDay).toBe(Math.floor(minTs / 86_400_000));
    const seeds = dailyScoresPdaSeeds(minTs);
    expect(seeds.seeds[0]).toBe("daily_scores_roots");
    expect(seeds.seeds[1]).toEqual([epochDay & 0xff, (epochDay >> 8) & 0xff]);
  });

  it("predicate_for_outcomes_unique", () => {
    const home = predicateForOutcome("home");
    const draw = predicateForOutcome("draw");
    const away = predicateForOutcome("away");
    expect(home.comparison).toEqual({ greaterThan: {} });
    expect(draw.comparison).toEqual({ equalTo: {} });
    expect(away.comparison).toEqual({ lessThan: {} });
  });

  it("build_fixture_summary", () => {
    const summary = buildFixtureSummary(TWO_STAT_FIXTURE);
    expect(summary.fixtureId).toBe("18172280");
    expect(summary.eventsSubTreeRoot).toHaveLength(32);
    expect(summary.updateStats.minTimestamp).toBe(String(TWO_STAT_FIXTURE.summary!.updateStats!.minTimestamp));
  });

  it("build_validate_stat_args_home", () => {
    const args = buildValidateStatArgs(TWO_STAT_FIXTURE, "home");
    expect(args.outcome).toBe("home");
    expect(args.stat2).not.toBeNull();
    expect(args.op).toEqual({ subtract: {} });
    expect(args.predicate).toEqual({ threshold: 0, comparison: { greaterThan: {} } });
    expect(args.fixtureProof.length).toBeGreaterThan(0);
    expect(args.mainTreeProof.length).toBeGreaterThan(0);
    expect(args.stat1.statToProve.key).toBe(1);
    expect(args.stat2!.statToProve.key).toBe(2);
  });

  it("single_stat_payload_rejected", () => {
    const single: TxlineStatValidationPayload = {
      ...TWO_STAT_FIXTURE,
      statToProve2: undefined,
      statProof2: undefined,
    };
    expect(() => buildValidateStatArgs(single, "draw")).toThrow(/two_stat/);
  });
});
