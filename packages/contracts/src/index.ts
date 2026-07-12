import { z } from "zod";

export const FixtureStatusSchema = z.enum(["scheduled", "live", "finished"]);

export const WcMatchFormatSchema = z.enum(["group", "knockout"]);

export const FixtureSchema = z.object({
  fixtureId: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  kickoffAt: z.string(),
  venueTimezone: z.string().optional(),
  status: FixtureStatusSchema,
  score: z
    .object({
      home: z.number().int().nonnegative(),
      away: z.number().int().nonnegative(),
    })
    .optional(),
  competition: z.string().optional(),
  /** group = 1X2 incl. draw; knockout = winner only (ET/penalties if level). */
  wcFormat: WcMatchFormatSchema.optional(),
});

export const OddsLineSchema = z.object({
  fixtureId: z.string(),
  market: z.string(),
  selection: z.string(),
  implied: z.number().min(0).max(1),
  openImplied: z.number().min(0).max(1).optional(),
  ts: z.string(),
});

export const ConsensusProbsSchema = z.object({
  home: z.number().min(0).max(1),
  draw: z.number().min(0).max(1).optional(),
  away: z.number().min(0).max(1),
  selection: z.enum(["home", "away", "draw"]),
  piTx: z.number().min(0).max(1),
  ts: z.string(),
});

export const CombinedProbSchema = z.object({
  c: z.number().min(0).max(1),
  alpha: z.number(),
  beta: z.number(),
  pi_tx: z.number().min(0).max(1),
  pi_model: z.number().min(0).max(1),
});

export const SettlementProofSchema = z.object({
  fixtureId: z.string(),
  merkleRoot: z.string(),
  leafHash: z.string(),
  proof: z.array(z.string()),
  statType: z.string(),
  statValue: z.string(),
  validated: z.boolean(),
  source: z.enum(["txline", "mock"]).default("mock"),
  chain: z.literal("solana").default("solana"),
  programId: z.string().optional(),
  txSig: z.string().optional(),
  explorerUrl: z.string().url().optional(),
  seq: z.number().int().optional(),
  statKey: z.number().int().optional(),
  verifyReason: z.string().optional(),
  ts: z.string(),
});

export const EdgeVerdictSchema = z.object({
  fixtureId: z.string(),
  verdict: z.enum(["HOLD", "SETUP"]),
  edge_score: z.number(),
  why: z.string(),
  ts: z.string(),
  direction: z.enum(["home", "away", "draw", "none"]).optional(),
  pi_tx: z.number().min(0).max(1),
  pi_model: z.number().min(0).max(1),
  c: z.number().min(0).max(1),
  epsilon_net: z.number().min(0),
});

export const FixturesListSchema = z.object({
  fixtures: z.array(FixtureSchema),
  source: z.enum(["mock", "txline"]),
});

export const MatchPhaseSchema = z.enum(["pre", "1H", "HT", "2H", "ET", "PEN", "FT"]);

export const MatchClockSchema = z.object({
  /** Live match phase derived from txline action signals. */
  phase: MatchPhaseSchema,
  /** Displayed match minute (1-based), absent when not running / pre-match. */
  minute: z.number().int().nonnegative().optional(),
  /** Raw running clock seconds from txline, when available. */
  seconds: z.number().int().nonnegative().optional(),
  running: z.boolean().default(false),
});

export const ScoresSnapshotSchema = z.object({
  fixtureId: z.string(),
  score: z.object({
    home: z.number().int().nonnegative(),
    away: z.number().int().nonnegative(),
  }),
  clock: MatchClockSchema.optional(),
  /** Penalty shootout score (PE period), when TxLINE reports it. */
  penScore: z
    .object({
      home: z.number().int().nonnegative(),
      away: z.number().int().nonnegative(),
    })
    .optional(),
  participant1IsHome: z.boolean().default(true),
  events: z
    .array(
      z.object({
        type: z.string(),
        minute: z.number().int().optional(),
        player: z.string().optional(),
        team: z.string().optional(),
      }),
    )
    .default([]),
  ts: z.string(),
});

export const OutcomeKeySchema = z.enum(["home", "draw", "away"]);

export const OutcomeEdgeRowSchema = z.object({
  outcome: OutcomeKeySchema,
  pi_tx: z.number().min(0).max(1),
  pi_model: z.number().min(0).max(1),
  c: z.number().min(0).max(1),
  edge: z.number(),
  isStrongest: z.boolean(),
});

export const OutcomeDecompositionSchema = z.object({
  outcomes: z.array(OutcomeEdgeRowSchema),
  strongest: OutcomeKeySchema,
  maxEdge: z.number(),
});

export const MatchEdgeSchema = z.object({
  fixture: FixtureSchema,
  odds: z.array(OddsLineSchema),
  scores: ScoresSnapshotSchema.optional(),
  edge: EdgeVerdictSchema,
  consensus: ConsensusProbsSchema.optional(),
  combined: CombinedProbSchema.optional(),
  decomposition: OutcomeDecompositionSchema.optional(),
});

export const EdgeSummaryItemSchema = z.object({
  fixtureId: z.string(),
  verdict: z.enum(["HOLD", "SETUP"]),
  edge_score: z.number(),
  pi_tx: z.number().min(0).max(1),
  pi_model: z.number().min(0).max(1),
  c: z.number().min(0).max(1),
  direction: z.enum(["home", "away", "draw", "none"]).optional(),
  hasOdds: z.boolean(),
  status: FixtureStatusSchema.optional(),
  score: z
    .object({
      home: z.number().int().nonnegative(),
      away: z.number().int().nonnegative(),
    })
    .optional(),
  clock: MatchClockSchema.optional(),
});

export const EdgeSummarySchema = z.object({
  items: z.array(EdgeSummaryItemSchema),
  ts: z.string(),
});

/** F86N — public API surface (no proprietary internals). */
export const ConvictionTierSchema = z.enum(["none", "low", "medium", "high"]);

export const PublicEdgeVerdictSchema = z.object({
  fixtureId: z.string(),
  verdict: z.enum(["HOLD", "SETUP"]),
  conviction: ConvictionTierSchema,
  why: z.string(),
  ts: z.string(),
  direction: z.enum(["home", "away", "draw", "none"]).optional(),
});

export const PublicEdgeSummaryItemSchema = z.object({
  fixtureId: z.string(),
  verdict: z.enum(["HOLD", "SETUP"]),
  conviction: ConvictionTierSchema,
  direction: z.enum(["home", "away", "draw", "none"]).optional(),
  hasOdds: z.boolean(),
  status: FixtureStatusSchema.optional(),
  score: z
    .object({
      home: z.number().int().nonnegative(),
      away: z.number().int().nonnegative(),
    })
    .optional(),
  clock: MatchClockSchema.optional(),
});

export const PublicMatchEdgeSchema = z.object({
  fixture: FixtureSchema,
  odds: z.array(OddsLineSchema),
  scores: ScoresSnapshotSchema.optional(),
  edge: PublicEdgeVerdictSchema,
  consensus: ConsensusProbsSchema.optional(),
});

export const PublicEdgeSummarySchema = z.object({
  items: z.array(PublicEdgeSummaryItemSchema),
  ts: z.string(),
});

export type Fixture = z.infer<typeof FixtureSchema>;
export type OddsLine = z.infer<typeof OddsLineSchema>;
export type ConsensusProbs = z.infer<typeof ConsensusProbsSchema>;
export type CombinedProb = z.infer<typeof CombinedProbSchema>;
export type SettlementProof = z.infer<typeof SettlementProofSchema>;
export type EdgeVerdict = z.infer<typeof EdgeVerdictSchema>;
export type PublicEdgeVerdict = z.infer<typeof PublicEdgeVerdictSchema>;
export type PublicEdgeSummaryItem = z.infer<typeof PublicEdgeSummaryItemSchema>;
export type PublicMatchEdge = z.infer<typeof PublicMatchEdgeSchema>;
export type PublicEdgeSummary = z.infer<typeof PublicEdgeSummarySchema>;
export type ConvictionTier = z.infer<typeof ConvictionTierSchema>;
export type MatchPhase = z.infer<typeof MatchPhaseSchema>;
export type WcMatchFormat = z.infer<typeof WcMatchFormatSchema>;
export type MatchClock = z.infer<typeof MatchClockSchema>;
export type ScoresSnapshot = z.infer<typeof ScoresSnapshotSchema>;
export type MatchEdge = z.infer<typeof MatchEdgeSchema>;
export type OutcomeEdgeRow = z.infer<typeof OutcomeEdgeRowSchema>;
export type OutcomeDecomposition = z.infer<typeof OutcomeDecompositionSchema>;
export type OutcomeKey = z.infer<typeof OutcomeKeySchema>;
export type EdgeSummaryItem = z.infer<typeof EdgeSummaryItemSchema>;
export type EdgeSummary = z.infer<typeof EdgeSummarySchema>;

export {
  EscrowOutcomeSchema,
  AnchorProofNodeSchema,
  AnchorPredicateSchema,
  CpiSettleArgsSchema,
  EscrowCpiResponseSchema,
  type EscrowOutcome,
  type CpiSettleArgs,
  type EscrowCpiResponse,
} from "./escrow.js";
