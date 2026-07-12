import type { EscrowCpiResponse, EscrowOutcome, Fixture, ScoresSnapshot } from "@natt-pundit/contracts";

const gateway = process.env.NEXT_PUBLIC_TXLINE_GATEWAY_URL ?? "http://localhost:4001";
const edgeApi = process.env.NEXT_PUBLIC_EDGE_API_URL ?? "http://localhost:4002";

export async function fetchFixtures() {
  const res = await fetch(`${gateway}/v1/fixtures`);
  if (!res.ok) throw new Error("fixtures_failed");
  return res.json();
}

export async function fetchGatewayFixture(fixtureId: string): Promise<Fixture> {
  const res = await fetch(`${gateway}/v1/fixtures/${encodeURIComponent(fixtureId)}`);
  if (!res.ok) throw new Error("fixture_failed");
  return res.json() as Promise<Fixture>;
}

export async function fetchMatchEdge(fixtureId: string) {
  const res = await fetch(`${edgeApi}/v1/edge/${fixtureId}`);
  if (!res.ok) throw new Error("edge_failed");
  return res.json();
}

export async function fetchEdgeVerdict(fixtureId: string) {
  const res = await fetch(`${edgeApi}/v1/edge/${fixtureId}/verdict`);
  if (!res.ok) throw new Error("verdict_failed");
  return res.json();
}

export async function fetchEdgeSummary() {
  const res = await fetch(`${edgeApi}/v1/edge/summary`);
  if (!res.ok) throw new Error("edge_summary_failed");
  return res.json();
}

export async function fetchDataIndex() {
  const res = await fetch(`${edgeApi}/v1/data/index`);
  if (!res.ok) throw new Error("data_index_failed");
  return res.json();
}

export async function fetchClvVerdict() {
  const res = await fetch(`${edgeApi}/v1/data/clv`);
  if (!res.ok) throw new Error("clv_failed");
  return res.json();
}

export async function fetchDataProofs(limit = 12) {
  const res = await fetch(`${edgeApi}/v1/data/proofs?limit=${limit}`);
  if (!res.ok) throw new Error("data_proofs_failed");
  return res.json();
}

export async function fetchMatchScores(fixtureId: string) {
  const res = await fetch(`${gateway}/v1/fixtures/${fixtureId}/scores`);
  if (!res.ok) throw new Error("scores_failed");
  return res.json() as Promise<ScoresSnapshot>;
}

export async function fetchSettlementProof(fixtureId: string) {
  const res = await fetch(`${gateway}/v1/fixtures/${fixtureId}/proof`);
  if (!res.ok) {
    let message = "proof_failed";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore parse */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchCpiArgs(fixtureId: string, outcome: EscrowOutcome): Promise<EscrowCpiResponse> {
  const res = await fetch(`${gateway}/v1/fixtures/${fixtureId}/cpi-args?outcome=${outcome}`);
  if (!res.ok) {
    let message = "cpi_args_failed";
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

export { gateway as GATEWAY_URL, edgeApi as EDGE_API_URL };
