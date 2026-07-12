import type { ConvictionTier, EdgeVerdict, PublicEdgeVerdict } from "@natt-pundit/contracts";

export type EdgeDisplayVerdict = EdgeVerdict | PublicEdgeVerdict;

export function isPublicEdgeVerdict(v: EdgeDisplayVerdict): v is PublicEdgeVerdict {
  return "conviction" in v && !("pi_model" in v);
}

const CONVICTION_RANK: Record<ConvictionTier, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function convictionRank(tier: ConvictionTier): number {
  return CONVICTION_RANK[tier];
}

export function displayConviction(v: EdgeDisplayVerdict | undefined): ConvictionTier | null {
  if (!v) return null;
  if (isPublicEdgeVerdict(v)) return v.conviction;
  if (v.edge_score <= 0) return "none";
  if (v.edge_score < 0.04) return "low";
  if (v.edge_score < 0.08) return "medium";
  return "high";
}
