import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  CombinedProbSchema,
  ConsensusProbsSchema,
  EdgeSummaryItemSchema,
  EdgeSummarySchema,
  EdgeVerdictSchema,
  MatchEdgeSchema,
  type EdgeVerdict,
  type Fixture,
  type OddsLine,
  type ScoresSnapshot,
} from "@natt-pundit/contracts";
import {
  COMBINE_ALPHA,
  COMBINE_BETA,
  computeEdgeVerdict,
  consensusFromOdds,
} from "@natt-pundit/natt-core";

const app = new Hono();
const gatewayUrl = process.env.TXLINE_GATEWAY_URL ?? "http://localhost:4001";
const webOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: webOrigin,
    allowMethods: ["GET", "OPTIONS"],
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "edge-api" }));

async function fetchFixturesList(): Promise<Fixture[]> {
  const res = await fetch(`${gatewayUrl}/v1/fixtures`);
  if (!res.ok) return [];
  const data = (await res.json()) as { fixtures: Fixture[] };
  return data.fixtures ?? [];
}

async function fetchOdds(fixtureId: string) {
  const res = await fetch(`${gatewayUrl}/v1/fixtures/${fixtureId}/odds`);
  if (!res.ok) return { lines: [] as OddsLine[], empty: false };
  const data = (await res.json()) as { odds: OddsLine[] };
  const lines = data.odds ?? [];
  return { lines, empty: lines.length === 0 };
}

async function fetchScores(fixtureId: string): Promise<ScoresSnapshot | null> {
  const res = await fetch(`${gatewayUrl}/v1/fixtures/${fixtureId}/scores`);
  if (!res.ok) return null;
  return (await res.json()) as ScoresSnapshot;
}

function mergeFixtureScore(fixture: Fixture, scores: ScoresSnapshot | null): Fixture {
  if (!scores) return fixture;
  return {
    ...fixture,
    score: scores.score,
    status:
      fixture.status === "scheduled" && (scores.score.home > 0 || scores.score.away > 0)
        ? "live"
        : fixture.status,
  };
}

function buildEdgePayload(
  fixtureId: string,
  lines: OddsLine[],
  scores: ScoresSnapshot | null,
  fixture: Fixture,
  ts: string,
): { edge: EdgeVerdict; consensus?: ReturnType<typeof consensusFromOdds> } {
  const score = scores?.score ?? fixture.score ?? { home: 0, away: 0 };
  const edge = EdgeVerdictSchema.parse(
    computeEdgeVerdict({
      fixtureId,
      lines,
      homeScore: score.home,
      awayScore: score.away,
      events: scores?.events,
      ts,
    }),
  );
  const consensus = consensusFromOdds(lines, ts);
  return { edge, consensus: consensus ?? undefined };
}

async function buildMatchEdge(fixtureId: string) {
  const ts = new Date().toISOString();
  const fixtures = await fetchFixturesList();
  const fixtureRaw = fixtures.find((f) => f.fixtureId === fixtureId);
  if (!fixtureRaw) return null;

  const [oddsResult, scores] = await Promise.all([
    fetchOdds(fixtureId),
    fetchScores(fixtureId),
  ]);

  const fixture = mergeFixtureScore(fixtureRaw, scores);
  const { edge, consensus } = buildEdgePayload(
    fixtureId,
    oddsResult.lines,
    scores,
    fixture,
    ts,
  );

  const combined =
    consensus &&
    CombinedProbSchema.parse({
      c: edge.c,
      alpha: COMBINE_ALPHA,
      beta: COMBINE_BETA,
      pi_tx: edge.pi_tx,
      pi_model: edge.pi_model,
    });

  return MatchEdgeSchema.parse({
    fixture,
    odds: oddsResult.lines,
    scores: scores ?? undefined,
    edge,
    consensus: consensus ? ConsensusProbsSchema.parse(consensus) : undefined,
    combined: combined ?? undefined,
  });
}

app.get("/v1/edge/:fixtureId", async (c) => {
  const payload = await buildMatchEdge(c.req.param("fixtureId"));
  if (!payload) {
    return c.json({ error: "fixture_not_found" }, 404);
  }
  return c.json(payload);
});

app.get("/v1/edge/:fixtureId/verdict", async (c) => {
  const fixtureId = c.req.param("fixtureId");
  const payload = await buildMatchEdge(fixtureId);
  if (!payload) {
    return c.json({ error: "fixture_not_found" }, 404);
  }
  return c.json(payload.edge);
});

const SUMMARY_CAP = 20;

async function buildSummaryItem(fixture: Fixture): Promise<ReturnType<typeof EdgeSummaryItemSchema.parse>> {
  const ts = new Date().toISOString();
  const fixtureId = fixture.fixtureId;
  const [oddsResult, scores] = await Promise.all([
    fetchOdds(fixtureId),
    fetchScores(fixtureId),
  ]);
  const merged = mergeFixtureScore(fixture, scores);
  const { edge } = buildEdgePayload(fixtureId, oddsResult.lines, scores, merged, ts);
  return EdgeSummaryItemSchema.parse({
    fixtureId,
    verdict: edge.verdict,
    edge_score: edge.edge_score,
    pi_tx: edge.pi_tx,
    pi_model: edge.pi_model,
    c: edge.c,
    direction: edge.direction,
    hasOdds: oddsResult.lines.length > 0,
  });
}

app.get("/v1/edge/summary", async (c) => {
  const fixtures = await fetchFixturesList();
  const capped = fixtures.slice(0, SUMMARY_CAP);
  const items = await Promise.all(capped.map((f) => buildSummaryItem(f)));
  const ts = new Date().toISOString();
  return c.json(EdgeSummarySchema.parse({ items, ts }));
});

const port = Number(process.env.PORT ?? 4002);
console.log(`edge-api on :${port} gateway=${gatewayUrl}`);
serve({ fetch: app.fetch, port });
