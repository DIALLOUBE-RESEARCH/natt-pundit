import axios from "axios";

const GATEWAY =
  process.env.PUNDIT_GATEWAY_URL || "http://natt-pundit-gateway:4001";
const EDGE = process.env.PUNDIT_EDGE_URL || "http://natt-pundit-edge-api:4002";

const client = axios.create({ timeout: 20000, headers: { Accept: "application/json" } });

export async function fetchFixtures(params = {}) {
  const { data } = await client.get(`${GATEWAY}/v1/fixtures`, { params });
  return data;
}

export async function fetchOdds(fixtureId) {
  const { data } = await client.get(`${GATEWAY}/v1/fixtures/${fixtureId}/odds`);
  return data;
}

export async function fetchScores(fixtureId) {
  const { data } = await client.get(`${GATEWAY}/v1/fixtures/${fixtureId}/scores`);
  return data;
}

export async function fetchProof(fixtureId) {
  const { data } = await client.get(`${GATEWAY}/v1/fixtures/${fixtureId}/proof`);
  return data;
}

export async function verifyProof(fixtureId) {
  const { data } = await client.get(`${GATEWAY}/v1/fixtures/${fixtureId}/proof/verify`);
  return data;
}

export async function fetchEdgeSummary() {
  const { data } = await client.get(`${EDGE}/v1/edge/summary`);
  return data;
}

export async function fetchMatchEdge(fixtureId) {
  const { data } = await client.get(`${EDGE}/v1/edge/${fixtureId}`);
  return data;
}

export async function fetchClvVerdict() {
  const { data } = await client.get(`${EDGE}/v1/data/clv`);
  return data;
}

export async function fetchDataIndex() {
  const { data } = await client.get(`${EDGE}/v1/data/index`);
  return data;
}
