import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FixturesListSchema,
  OddsLineSchema,
  ScoresSnapshotSchema,
} from "@natt-pundit/contracts";
import type { Fixture, OddsLine, ScoresSnapshot } from "@natt-pundit/contracts";
import {
  TXLINE_API_BASE,
  WC_FREE_SERVICE_LEVEL_REALTIME,
  SUBSCRIBE_DURATION_WEEKS,
  filterWc26ListableFixtures,
} from "@natt-pundit/natt-core";
import { z } from "zod";
import { txlineGet, fetchScoreUpdates } from "./txlineClient.js";
import { listArchivedFixtures } from "./fixtureArchive.js";
import { mergeVisibleWithArchive } from "./fixtureListMerge.js";
import { reconcileFixtures } from "./fixtureStore.js";
import { resolveFixtureMeta, warmFixtureMetadata } from "./fixtureMetaResolve.js";
import { reconcileScoreRows, mergeScoreRows, loadScoreRows, maxRowSeq } from "./scoreStore.js";
import {
  mapFixture,
  mapOdds,
  mapScores,
  oddsDebugSummary,
  wcCompetitionId,
  type TxlineFixtureRow,
  type TxlineOddsRow,
  type TxlineScoreRow,
} from "./txlineMap.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "../../../fixtures");

export const useMock = (): boolean => {
  if (process.env.TXODDS_MOCK === "true") return true;
  if (process.env.TXODDS_MOCK === "false") return false;
  return !process.env.TXLINE_API_TOKEN;
};

function loadMockBundle(name: string) {
  const raw = readFileSync(join(FIXTURES_DIR, name), "utf8");
  return JSON.parse(raw) as {
    fixtures: Fixture[];
    odds: OddsLine[];
    scores: ScoresSnapshot;
  };
}

const liveBundle = loadMockBundle("wc_live_match.json");
const replayBundle = loadMockBundle("wc_replay_match.json");

function mockFixtures(): { fixtures: Fixture[]; source: "mock" } {
  return {
    fixtures: [...liveBundle.fixtures, ...replayBundle.fixtures],
    source: "mock",
  };
}

export async function listFixtures(): Promise<{
  fixtures: Fixture[];
  source: "mock" | "txline";
}> {
  if (useMock()) return mockFixtures();

  const rows = await txlineGet<TxlineFixtureRow[]>("/api/fixtures/snapshot");
  const compId = wcCompetitionId();
  const filtered = compId
    ? rows.filter((r) => r.CompetitionId === compId || r.Competition === "World Cup")
    : rows;

  const live = filtered.map((row) => mapFixture(row));

  // Rolling store (36h) + permanent archive so finished WC matches stay listable
  // after TxLINE drops them from its snapshot (jury / post-tournament demo).
  const visible = reconcileFixtures(live);
  const merged = mergeVisibleWithArchive(visible, listArchivedFixtures());
  const fixtures = filterWc26ListableFixtures(merged);
  return { fixtures, source: "txline" };
}

export async function getFixtureOdds(fixtureId: string): Promise<OddsLine[]> {
  if (useMock()) {
    if (fixtureId === "mock-live-1") return liveBundle.odds;
    if (fixtureId === "mock-replay-1") return replayBundle.odds;
    return [];
  }

  const rows = await txlineGet<TxlineOddsRow[]>(`/api/odds/snapshot/${fixtureId}`);
  const mapped = mapOdds(fixtureId, rows);
  if (mapped.length === 0 && process.env.ODDS_DEBUG === "true") {
    console.warn(
      `[odds] empty map for ${fixtureId}`,
      JSON.stringify(oddsDebugSummary(fixtureId, rows)),
    );
  }
  return mapped;
}

export async function getFixtureOddsDebug(fixtureId: string) {
  if (useMock()) {
    return {
      fixtureId,
      mock: true,
      mapped: await getFixtureOdds(fixtureId),
    };
  }
  const rows = await txlineGet<TxlineOddsRow[]>(`/api/odds/snapshot/${fixtureId}`);
  return { mock: false, ...oddsDebugSummary(fixtureId, rows) };
}

export async function getFixtureScores(fixtureId: string): Promise<ScoresSnapshot | null> {
  if (useMock()) {
    if (fixtureId === "mock-live-1") return liveBundle.scores;
    if (fixtureId === "mock-replay-1") return replayBundle.scores;
    return null;
  }

  const rows = await txlineGet<TxlineScoreRow[]>(`/api/scores/snapshot/${fixtureId}`);
  const merged = await enrichScoreRows(fixtureId, rows);
  return mapScores(fixtureId, merged);
}

async function enrichScoreRows(fixtureId: string, snapshot: TxlineScoreRow[]): Promise<TxlineScoreRow[]> {
  let merged = reconcileScoreRows(fixtureId, snapshot);
  try {
    const updates = await fetchScoreUpdates<TxlineScoreRow>(fixtureId);
    if (!updates.length) return merged;

    const storeMax = maxRowSeq(merged);
    const updMax = maxRowSeq(updates);
    const storeRows = loadScoreRows(fixtureId);
    const lagging =
      storeMax === null ||
      updMax === null ||
      storeMax < updMax ||
      storeRows.length < Math.min(updates.length, 120);

    if (lagging) {
      merged = mergeScoreRows(fixtureId, updates, merged);
    }
  } catch (err) {
    console.warn(
      `[txline] updates backfill ${fixtureId} failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
  return merged;
}

export async function guestJwt(): Promise<string> {
  const res = await fetch(`${TXLINE_API_BASE}/auth/guest/start`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`guest auth failed: ${res.status}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

const ActivateBodySchema = z.object({
  txSig: z.string().min(1),
  walletSignature: z.string().min(1),
  leagues: z.array(z.number()).default([]),
  guestJwt: z.string().min(1),
});

export async function activateApiToken(body: z.infer<typeof ActivateBodySchema>) {
  const { guestJwt: jwt, txSig, walletSignature, leagues } = body;
  const res = await fetch(`${TXLINE_API_BASE}/api/token/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ txSig, walletSignature, leagues }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`activate failed: ${res.status} ${text}`);
  }
  const text = (await res.text()).trim();
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { token?: string };
      return parsed.token ?? text;
    } catch {
      return text;
    }
  }
  return text;
}

export async function getFixtureById(fixtureId: string): Promise<Fixture | null> {
  const resolved = await resolveFixtureMeta(fixtureId);
  if (resolved) return resolved;

  const { fixtures } = await listFixtures();
  return fixtures.find((f) => f.fixtureId === fixtureId) ?? null;
}

export { warmFixtureMetadata };

export const BuildSubscribeSchema = z.object({
  walletPubkey: z.string().min(32),
  serviceLevelId: z.number().int().default(WC_FREE_SERVICE_LEVEL_REALTIME),
  durationWeeks: z.number().int().default(SUBSCRIBE_DURATION_WEEKS),
});

export { FixturesListSchema, OddsLineSchema, ScoresSnapshotSchema };
