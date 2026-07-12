import { describe, expect, it } from "vitest";
import { buildValidateStatArgs } from "@natt-pundit/natt-core";
import { CpiSettleArgsSchema } from "@natt-pundit/contracts";

const MOCK_TWO_STAT = {
  summary: {
    fixtureId: 18172280,
    updateStats: {
      updateCount: 3,
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
  statToProve: { key: 1, value: 2, period: 0 },
  statToProve2: { key: 2, value: 1, period: 0 },
  eventStatRoot: "5a39c823c7da97613900da7ebc70cb48e0c8978db635a5e925804898b1153861",
  statProof: [
    { hash: "cc884eba535f1794cb0432b1851139306813989145306d1a3c543bb1e0f1907b", isRightSibling: false },
  ],
  statProof2: [
    { hash: "9c124e61fc17cd91d02bcbccd869e5f73e121595f980fd681cda151a0683eb69", isRightSibling: true },
  ],
};

describe("cpiArgs", () => {
  it("build_validate_stat_args_matches_contract_schema", () => {
    const raw = buildValidateStatArgs(MOCK_TWO_STAT, "home");
    const parsed = CpiSettleArgsSchema.parse(raw);
    expect(parsed.outcome).toBe("home");
    expect(parsed.stat2?.statToProve.key).toBe(2);
    expect(parsed.dailyScoresPdaSeeds.seeds[0]).toBe("daily_scores_roots");
  });

  it("draw_outcome_uses_equal_predicate", () => {
    const raw = buildValidateStatArgs(MOCK_TWO_STAT, "draw");
    expect(raw.predicate.comparison).toEqual({ equalTo: {} });
  });
});
