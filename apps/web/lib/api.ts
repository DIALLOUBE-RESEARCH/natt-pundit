const gateway = process.env.NEXT_PUBLIC_TXLINE_GATEWAY_URL ?? "http://localhost:4001";
const edgeApi = process.env.NEXT_PUBLIC_EDGE_API_URL ?? "http://localhost:4002";

export async function fetchFixtures() {
  const res = await fetch(`${gateway}/v1/fixtures`);
  if (!res.ok) throw new Error("fixtures_failed");
  return res.json();
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

export async function fetchSettlementProof(fixtureId: string) {
  const res = await fetch(`${gateway}/v1/fixtures/${fixtureId}/proof`);
  if (!res.ok) throw new Error("proof_failed");
  return res.json();
}

export { gateway as GATEWAY_URL, edgeApi as EDGE_API_URL };
