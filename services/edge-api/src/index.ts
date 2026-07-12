import { existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import archiver from "archiver";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DATA_STREAMS, mergeOddsLines, stabilize1x2Lines } from "./dataLog.js";
import {
  ConsensusProbsSchema,
  EdgeSummaryItemSchema,
  EdgeSummarySchema,
  EdgeVerdictSchema,
  MatchEdgeSchema,
  OutcomeDecompositionSchema,
  PublicEdgeSummarySchema,
  PublicMatchEdgeSchema,
  type EdgeVerdict,
  type Fixture,
  type OddsLine,
  type ScoresSnapshot,
  type SettlementProof,
  type OutcomeDecomposition,
} from "@natt-pundit/contracts";
import {
  getClvVerdict,
  getDataIndex,
  getRecentProofs,
  startDataLogger,
  streamFilePath,
} from "./dataLogger.js";
import {
  computeEdgeVerdict,
  computeOutcomeDecomposition,
  MAX_1X2_HOME_JUMP,
  SETUP_LATCH_INVALIDATE,
  SETUP_LATCH_MS,
} from "@natt-pundit/natt-edge-engine";
import { consensusFromOdds, only1x2Lines } from "@natt-pundit/natt-core";
import {
  isEdgeIpRedactEnabled,
  toPublicEdgeSummaryItem,
  toPublicEdgeVerdict,
  toPublicMatchEdge,
} from "./redact.js";

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

const ODDS_CACHE_MS = Number(process.env.EDGE_ODDS_CACHE_MS ?? 120_000);
// How long a cached 1X2 snapshot stays valid to backfill non-1X2 ticks (F70N T8).
const ODDS_1X2_TTL_MS = Number(process.env.EDGE_ODDS_1X2_TTL_MS ?? 1_200_000);
const oddsCache = new Map<string, { lines: OddsLine[]; at: number }>();
const last1x2Cache = new Map<string, { lines: OddsLine[]; at: number }>();
/** Last accepted 1X2 snapshot per fixture (F70N T9 jump filter). */
const stable1x2Cache = new Map<string, OddsLine[]>();

function has1x2(lines: OddsLine[]): boolean {
  return only1x2Lines(lines).length > 0;
}

/**
 * Backfill the last known 1X2 lines when the current tick carries only another
 * market (OU / AH / LINE). Rejects volatile 1X2 jumps that flip SETUP/HOLD
 * (F70N T8 + T9).
 */
function withCarriedForward1x2(fixtureId: string, lines: OddsLine[]): OddsLine[] {
  if (has1x2(lines)) {
    const stable = stable1x2Cache.get(fixtureId) ?? [];
    const guardStable =
      setupLatch.has(fixtureId) || setupState.get(fixtureId) === true;
    let effective = lines;
    if (guardStable && stable.length > 0) {
      const stabilized = stabilize1x2Lines(stable, lines, MAX_1X2_HOME_JUMP);
      effective = stabilized.lines;
      if (stabilized.accepted) {
        stable1x2Cache.set(fixtureId, only1x2Lines(effective));
      }
    } else {
      stable1x2Cache.set(fixtureId, only1x2Lines(lines));
      effective = lines;
    }
    last1x2Cache.set(fixtureId, {
      lines: only1x2Lines(effective),
      at: Date.now(),
    });
    return effective;
  }
  const cached = last1x2Cache.get(fixtureId);
  if (cached && Date.now() - cached.at < ODDS_1X2_TTL_MS) {
    return mergeOddsLines(cached.lines, lines);
  }
  const stable = stable1x2Cache.get(fixtureId);
  if (stable && stable.length > 0) {
    return mergeOddsLines(stable, lines);
  }
  return lines;
}

async function fetchOdds(fixtureId: string) {
  const res = await fetch(`${gatewayUrl}/v1/fixtures/${fixtureId}/odds`);
  if (!res.ok) {
    const cached = oddsCache.get(fixtureId);
    if (cached && Date.now() - cached.at < ODDS_CACHE_MS) {
      return { lines: cached.lines, empty: false, stale: true };
    }
    return { lines: [] as OddsLine[], empty: false };
  }
  const data = (await res.json()) as { odds: OddsLine[] };
  const lines = data.odds ?? [];
  if (lines.length > 0) {
    const effective = withCarriedForward1x2(fixtureId, lines);
    oddsCache.set(fixtureId, { lines: effective, at: Date.now() });
    return { lines: effective, empty: false, stale: false };
  }
  const cached = oddsCache.get(fixtureId);
  if (cached && Date.now() - cached.at < ODDS_CACHE_MS) {
    return { lines: cached.lines, empty: false, stale: true };
  }
  return { lines: [], empty: lines.length === 0 };
}

async function fetchScores(fixtureId: string): Promise<ScoresSnapshot | null> {
  const res = await fetch(`${gatewayUrl}/v1/fixtures/${fixtureId}/scores`);
  if (!res.ok) return null;
  return (await res.json()) as ScoresSnapshot;
}

async function fetchProof(fixtureId: string): Promise<SettlementProof | null> {
  try {
    const res = await fetch(`${gatewayUrl}/v1/fixtures/${fixtureId}/proof`);
    if (!res.ok) return null;
    return (await res.json()) as SettlementProof;
  } catch {
    return null;
  }
}

function mergeFixtureScore(fixture: Fixture, scores: ScoresSnapshot | null): Fixture {
  if (!scores) return fixture;
  const phase = scores.clock?.phase;
  let status = fixture.status;
  if (phase === "FT") {
    status = "finished";
  } else if (phase === "PEN" || phase === "ET" || phase === "1H" || phase === "2H" || phase === "HT") {
    status = "live";
  } else if (phase && phase !== "pre") {
    status = "live";
  } else if (fixture.status === "scheduled" && (scores.score.home > 0 || scores.score.away > 0)) {
    status = "live";
  }
  return { ...fixture, score: scores.score, status };
}

// Per-fixture SETUP memory for verdict hysteresis (F70N T8). Module-level so it
// persists across polls; entry at EPSILON_NET, exit only below EPSILON_NET_EXIT.
const setupState = new Map<string, boolean>();
const isSetupVerdict = (v: string): boolean => v === "SETUP" || v === "SETUP_CANDIDATE";

/** Display latch (F70N T9): keep SETUP visible after a genuine trigger. */
type SetupLatch = {
  untilMs: number;
  edge_score: number;
  direction: EdgeVerdict["direction"];
  pi_tx: number;
  pi_model: number;
  c: number;
  why: string;
};
const setupLatch = new Map<string, SetupLatch>();

function applySetupLatch(fixtureId: string, edge: EdgeVerdict): EdgeVerdict {
  const now = Date.now();
  if (isSetupVerdict(edge.verdict)) {
    setupLatch.set(fixtureId, {
      untilMs: now + SETUP_LATCH_MS,
      edge_score: edge.edge_score,
      direction: edge.direction,
      pi_tx: edge.pi_tx,
      pi_model: edge.pi_model,
      c: edge.c,
      why: edge.why,
    });
    return edge;
  }
  const latched = setupLatch.get(fixtureId);
  if (latched && now < latched.untilMs && edge.edge_score > SETUP_LATCH_INVALIDATE) {
    return {
      ...edge,
      verdict: "SETUP",
      edge_score: latched.edge_score,
      direction: latched.direction,
      pi_tx: latched.pi_tx,
      pi_model: latched.pi_model,
      c: latched.c,
      why: `${latched.why} [SETUP latched — feed 1X2 volatile, holding last candidate]`,
    };
  }
  if (latched && (now >= latched.untilMs || edge.edge_score <= SETUP_LATCH_INVALIDATE)) {
    setupLatch.delete(fixtureId);
  }
  return edge;
}

function buildEdgePayload(
  fixtureId: string,
  lines: OddsLine[],
  scores: ScoresSnapshot | null,
  fixture: Fixture,
  ts: string,
): { edge: EdgeVerdict; consensus?: ReturnType<typeof consensusFromOdds>; decomposition?: OutcomeDecomposition } {
  const score = scores?.score ?? fixture.score ?? { home: 0, away: 0 };
  const edgeInput = {
    fixtureId,
    lines,
    homeScore: score.home,
    awayScore: score.away,
    events: scores?.events,
    kickoffAt: fixture.kickoffAt,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    ts,
    prevInSetup: setupState.get(fixtureId) ?? false,
  };
  const raw = computeEdgeVerdict(edgeInput);
  setupState.set(fixtureId, isSetupVerdict(raw.verdict));
  const edge = EdgeVerdictSchema.parse(applySetupLatch(fixtureId, raw));
  const consensus = consensusFromOdds(lines, ts);
  const decompositionRaw = computeOutcomeDecomposition(edgeInput);
  const decomposition = decompositionRaw
    ? OutcomeDecompositionSchema.parse(decompositionRaw)
    : undefined;
  return { edge, consensus: consensus ?? undefined, decomposition };
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
  const { edge, consensus, decomposition } = buildEdgePayload(
    fixtureId,
    oddsResult.lines,
    scores,
    fixture,
    ts,
  );

  return MatchEdgeSchema.parse({
    fixture,
    odds: oddsResult.lines,
    scores: scores ?? undefined,
    edge,
    consensus: consensus ? ConsensusProbsSchema.parse(consensus) : undefined,
    decomposition,
  });
}

// Covers live + upcoming + recently-finished (kept by the gateway store for 36h).
const SUMMARY_CAP = 40;

/** Build an EdgeSummaryItem from already-fetched inputs (no I/O) — shared by
 * the summary endpoint and the data logger to avoid double fetches. */
function edgeItemFrom(
  fixture: Fixture,
  lines: OddsLine[],
  scores: ScoresSnapshot | null,
): ReturnType<typeof EdgeSummaryItemSchema.parse> {
  const ts = new Date().toISOString();
  const merged = mergeFixtureScore(fixture, scores);
  const { edge } = buildEdgePayload(fixture.fixtureId, lines, scores, merged, ts);
  return EdgeSummaryItemSchema.parse({
    fixtureId: fixture.fixtureId,
    verdict: edge.verdict,
    edge_score: edge.edge_score,
    pi_tx: edge.pi_tx,
    pi_model: edge.pi_model,
    c: edge.c,
    direction: edge.direction,
    hasOdds: lines.length > 0,
    status: merged.status,
    score: merged.score,
    clock: scores?.clock,
  });
}

async function buildSummaryItem(fixture: Fixture): Promise<ReturnType<typeof EdgeSummaryItemSchema.parse>> {
  const [oddsResult, scores] = await Promise.all([
    fetchOdds(fixture.fixtureId),
    fetchScores(fixture.fixtureId),
  ]);
  return edgeItemFrom(fixture, oddsResult.lines, scores);
}

/** Register before /v1/edge/:fixtureId — otherwise "summary" is captured as fixtureId. */
app.get("/v1/edge/summary", async (c) => {
  const fixtures = await fetchFixturesList();
  const capped = fixtures.slice(0, SUMMARY_CAP);
  const items = await Promise.all(capped.map((f) => buildSummaryItem(f)));
  const ts = new Date().toISOString();
  if (isEdgeIpRedactEnabled()) {
    return c.json(
      PublicEdgeSummarySchema.parse({
        items: items.map((item) => toPublicEdgeSummaryItem(item)),
        ts,
      }),
    );
  }
  return c.json(EdgeSummarySchema.parse({ items, ts }));
});

app.get("/v1/data/index", (c) => c.json(getDataIndex()));

app.get("/v1/data/clv", (c) => c.json(getClvVerdict()));

app.get("/v1/data/proofs", (c) => {
  const limit = Number(c.req.query("limit") ?? 12);
  return c.json(getRecentProofs(Number.isFinite(limit) ? limit : 12));
});

function buildManifest() {
  const index = getDataIndex();
  const clv = getClvVerdict();
  return {
    dataset: "natt-pundit-football-edge",
    description:
      "Append-only football odds/scores/edge/proof dataset with a Closing Line Value (CLV) harness. FIFA World Cup 2026.",
    generatedAt: new Date().toISOString(),
    source: "TxLINE (odds/scores) + Natt fundamental model (Elo Poisson / Dixon-Coles)",
    methodology: {
      consensus: "Shin de-vig on 1X2 implied probabilities",
      model: "Proprietary fundamental + live-adjusted model (server-only)",
      combine: "Proprietary log-opinion pool (weights not disclosed)",
      setup_rule: "SETUP when model disagrees with Shin consensus above pre-registered threshold",
      clv: "CLV = fairClose/fairEntry - 1 on the picked direction; entry = first clean setup (formulaVersion f70n_v2), fair probs from the Shin-devigged odds series (entry = first snapshot after the flag, close = last snapshot). Pre-f70n_v2 records excluded. Certified only when N>=500 and block-bootstrap 95% CI lower bound > 0; below 30 samples the mean is indicative (noise), not a verdict.",
    },
    clv_verdict: clv,
    streams: index.streams,
    license: "Research / academic use. Provided as-is, no warranty. Odds data (c) TxLINE.",
  };
}

function buildDatacard(): string {
  const m = buildManifest();
  const lines = [
    "# Natt Pundit — Football Edge Dataset",
    "",
    m.description,
    "",
    `Generated: ${m.generatedAt}`,
    `Source: ${m.source}`,
    "",
    "## Methodology",
    `- Consensus: ${m.methodology.consensus}`,
    `- Model: ${m.methodology.model}`,
    `- Combine: ${m.methodology.combine}`,
    `- Setup rule: ${m.methodology.setup_rule}`,
    `- CLV: ${m.methodology.clv}`,
    "",
    "## CLV verdict (honest)",
    `- verdict: ${m.clv_verdict.verdict}`,
    `- N: ${m.clv_verdict.n} / ${m.clv_verdict.nMin}`,
    `- mean CLV: ${(m.clv_verdict.meanClv * 100).toFixed(3)} pp`,
    `- 95% CI: [${(m.clv_verdict.ciLo * 100).toFixed(3)}, ${(m.clv_verdict.ciHi * 100).toFixed(3)}] pp`,
    `- % beating the close: ${(m.clv_verdict.pctBeats * 100).toFixed(1)}%`,
    "",
    "## Streams (data/*.jsonl)",
    ...m.streams.map((s) => `- ${s.name}: ${s.records} records (${s.bytes} bytes)`),
    "",
    "## License",
    m.license,
    "",
  ];
  return lines.join("\n");
}

async function buildZip(): Promise<Buffer> {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (d: Buffer) => chunks.push(d));
  const done = new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", (e) => reject(e));
  });
  for (const stream of DATA_STREAMS) {
    const p = streamFilePath(stream);
    if (existsSync(p)) archive.file(p, { name: `data/${stream}.jsonl` });
  }
  archive.append(buildDatacard(), { name: "DATACARD.md" });
  archive.append(JSON.stringify(buildManifest(), null, 2), { name: "manifest.json" });
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}

app.get("/v1/data/export", async (c) => {
  const required = process.env.NATT_DATAS_EXPORT_INTERNAL_SECRET?.trim();
  const hdr = c.req.header("X-Datas-Export-Internal");
  if (!required || hdr !== required) {
    return c.json({ error: "forbidden" }, 403);
  }
  const buf = await buildZip();
  c.header("Content-Type", "application/zip");
  c.header("Content-Disposition", 'attachment; filename="natt-pundit-dataset.zip"');
  return c.body(new Uint8Array(buf));
});

app.get("/v1/edge/:fixtureId", async (c) => {
  const payload = await buildMatchEdge(c.req.param("fixtureId"));
  if (!payload) {
    return c.json({ error: "fixture_not_found" }, 404);
  }
  return c.json(isEdgeIpRedactEnabled() ? toPublicMatchEdge(payload) : payload);
});

app.get("/v1/edge/:fixtureId/verdict", async (c) => {
  const fixtureId = c.req.param("fixtureId");
  const payload = await buildMatchEdge(fixtureId);
  if (!payload) {
    return c.json({ error: "fixture_not_found" }, 404);
  }
  return c.json(
    isEdgeIpRedactEnabled() ? toPublicEdgeVerdict(payload.edge) : payload.edge,
  );
});

startDataLogger({
  fetchFixturesList,
  fetchOdds: async (id) => (await fetchOdds(id)).lines,
  fetchScores,
  fetchProof,
  buildEdgeItem: (fixture, lines, scores) => edgeItemFrom(fixture, lines, scores),
});

const port = Number(process.env.PORT ?? 4002);
console.log(`edge-api on :${port} gateway=${gatewayUrl}`);
serve({ fetch: app.fetch, port });
