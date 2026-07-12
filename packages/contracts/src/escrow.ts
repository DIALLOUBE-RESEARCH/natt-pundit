import { z } from "zod";

export const EscrowOutcomeSchema = z.enum(["home", "draw", "away"]);

export const AnchorProofNodeSchema = z.object({
  hash: z.array(z.number().int().min(0).max(255)).length(32),
  isRightSibling: z.boolean(),
});

export const AnchorPredicateSchema = z.object({
  threshold: z.number().int(),
  comparison: z.union([
    z.object({ greaterThan: z.object({}).strict() }),
    z.object({ lessThan: z.object({}).strict() }),
    z.object({ equalTo: z.object({}).strict() }),
  ]),
});

export const CpiSettleArgsSchema = z.object({
  programId: z.string(),
  targetTs: z.string(),
  fixtureSummary: z.object({
    fixtureId: z.string(),
    updateStats: z.object({
      updateCount: z.number().int().nonnegative(),
      minTimestamp: z.string(),
      maxTimestamp: z.string(),
    }),
    eventsSubTreeRoot: z.array(z.number().int().min(0).max(255)).length(32),
  }),
  fixtureProof: z.array(AnchorProofNodeSchema),
  mainTreeProof: z.array(AnchorProofNodeSchema),
  predicate: AnchorPredicateSchema,
  stat1: z.object({
    statToProve: z.object({
      key: z.number().int(),
      value: z.number().int(),
      period: z.number().int(),
    }),
    eventStatRoot: z.array(z.number().int().min(0).max(255)).length(32),
    statProof: z.array(AnchorProofNodeSchema),
  }),
  stat2: z
    .object({
      statToProve: z.object({
        key: z.number().int(),
        value: z.number().int(),
        period: z.number().int(),
      }),
      eventStatRoot: z.array(z.number().int().min(0).max(255)).length(32),
      statProof: z.array(AnchorProofNodeSchema),
    })
    .nullable(),
  op: z.object({ subtract: z.object({}).strict() }).nullable(),
  outcome: EscrowOutcomeSchema,
  dailyScoresPdaSeeds: z.object({
    epochDay: z.number().int().nonnegative(),
    seeds: z.tuple([z.literal("daily_scores_roots"), z.array(z.number().int().min(0).max(255))]),
  }),
});

export type EscrowOutcome = z.infer<typeof EscrowOutcomeSchema>;
export type CpiSettleArgs = z.infer<typeof CpiSettleArgsSchema>;

const CpiTargetSchema = z.object({
  home: z.number().int(),
  away: z.number().int(),
  mode: z.literal("regulation"),
});

/**
 * F95N security: the only settle mode is `standard` — `winning_side` is always derived
 * on-chain from the TxLINE CPI proof (goal stats, or pen-goal stats for shootouts).
 * The former `knockout_tab` mode (client-asserted pen winner) was removed as CRITICAL.
 */
export const EscrowCpiStandardResponseSchema = CpiSettleArgsSchema.extend({
  settleMode: z.literal("standard"),
  cluster: z.enum(["devnet", "mainnet"]),
  txlineProgramId: z.string(),
  cpiTarget: CpiTargetSchema,
});

export const EscrowCpiResponseSchema = EscrowCpiStandardResponseSchema;

export type EscrowCpiResponse = z.infer<typeof EscrowCpiResponseSchema>;
