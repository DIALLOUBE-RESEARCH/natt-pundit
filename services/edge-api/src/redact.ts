import type {
  EdgeSummaryItem,
  EdgeVerdict,
  MatchEdge,
  PublicEdgeSummaryItem,
  PublicEdgeVerdict,
  PublicMatchEdge,
} from "@natt-pundit/contracts";
import { convictionFromEdgeScore } from "@natt-pundit/natt-edge-engine";

export function isEdgeIpRedactEnabled(): boolean {
  const raw = process.env.NATT_EDGE_IP_REDACT?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

function publicWhy(
  verdict: EdgeVerdict["verdict"],
  direction: EdgeVerdict["direction"],
  conviction: ReturnType<typeof convictionFromEdgeScore>,
): string {
  if (verdict === "SETUP" && direction && direction !== "none") {
    return `SETUP on ${direction} — independent model disagrees with Shin consensus (${conviction} conviction).`;
  }
  if (verdict === "SETUP") {
    return "SETUP — independent model disagrees with Shin market consensus.";
  }
  return "Model agrees with market consensus — no actionable candidate.";
}

export function toPublicEdgeVerdict(edge: EdgeVerdict): PublicEdgeVerdict {
  const conviction = convictionFromEdgeScore(edge.edge_score);
  return {
    fixtureId: edge.fixtureId,
    verdict: edge.verdict,
    conviction,
    why: publicWhy(edge.verdict, edge.direction, conviction),
    ts: edge.ts,
    direction: edge.direction,
  };
}

export function toPublicEdgeSummaryItem(item: EdgeSummaryItem): PublicEdgeSummaryItem {
  return {
    fixtureId: item.fixtureId,
    verdict: item.verdict,
    conviction: convictionFromEdgeScore(item.edge_score),
    direction: item.direction,
    hasOdds: item.hasOdds,
    status: item.status,
    score: item.score,
    clock: item.clock,
  };
}

export function toPublicMatchEdge(payload: MatchEdge): PublicMatchEdge {
  return {
    fixture: payload.fixture,
    odds: payload.odds,
    scores: payload.scores,
    edge: toPublicEdgeVerdict(payload.edge),
    consensus: payload.consensus,
  };
}
