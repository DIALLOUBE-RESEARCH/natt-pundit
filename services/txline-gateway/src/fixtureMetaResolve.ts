import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Fixture } from "@natt-pundit/contracts";
import { lookupArchivedFixture, rememberFixtures } from "./fixtureArchive.js";
import { lookupStoredFixture } from "./fixtureStore.js";
import { loadScoreRows, scoreHistoryKickoffTs } from "./scoreStore.js";
import { mapFixture, phaseToStatus, type TxlineFixtureRow } from "./txlineMap.js";
import { txlineGet } from "./txlineClient.js";
import { bootstrapFixtureMetaSeed, seedFixtureMeta } from "./fixtureMetaSeed.js";

function useLiveTxline(): boolean {
  return process.env.TXLINE_USE_MOCK !== "true" && Boolean(process.env.TXLINE_API_TOKEN?.trim());
}

const CACHE_PATH = process.env.PARTICIPANT_ID_CACHE_PATH ?? "/data/participant-id-cache.json";
const SCORE_ROWS_DIR = process.env.SCORE_ROWS_STORE_DIR ?? "/data/score-rows";

type IdCache = Record<string, string>;

function loadIdCache(): IdCache {
  try {
    const raw = readFileSync(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as IdCache;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* empty */
  }
  return {};
}

function persistIdCache(cache: IdCache): void {
  try {
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf8");
  } catch (err) {
    console.warn(
      `[participantIdCache] persist failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

let idCache: IdCache = loadIdCache();

export function bindParticipantIdsFromFixtureRow(row: TxlineFixtureRow): void {
  const fixtureId = String(row.FixtureId);
  const rows = loadScoreRows(fixtureId);
  const meta = rows.find((r) => r.Participant1Id && r.Participant2Id);
  if (!meta?.Participant1Id || !meta.Participant2Id) return;

  const p1IsHome = meta.Participant1IsHome ?? row.Participant1IsHome;
  const homeName = p1IsHome ? row.Participant1 : row.Participant2;
  const awayName = p1IsHome ? row.Participant2 : row.Participant1;

  idCache[String(meta.Participant1Id)] = row.Participant1;
  idCache[String(meta.Participant2Id)] = row.Participant2;
  persistIdCache(idCache);

  rememberFixtures([
    {
      fixtureId,
      homeTeam: homeName,
      awayTeam: awayName,
      kickoffAt: new Date(row.StartTime).toISOString(),
      status: phaseToStatus("pre"),
      competition: row.Competition ?? "World Cup",
    },
  ]);
}

function hydrateFromScoreParticipantIds(fixtureId: string): Fixture | null {
  const rows = loadScoreRows(fixtureId);
  if (!rows.length) return null;

  let p1Id: number | undefined;
  let p2Id: number | undefined;
  let p1IsHome = true;
  for (const r of rows) {
    if (typeof r.Participant1Id === "number") p1Id = r.Participant1Id;
    if (typeof r.Participant2Id === "number") p2Id = r.Participant2Id;
    if (typeof r.Participant1IsHome === "boolean") p1IsHome = r.Participant1IsHome;
  }
  if (p1Id === undefined || p2Id === undefined) return null;

  const n1 = idCache[String(p1Id)];
  const n2 = idCache[String(p2Id)];
  if (!n1 || !n2) return null;

  const homeTeam = p1IsHome ? n1 : n2;
  const awayTeam = p1IsHome ? n2 : n1;
  const kickoffMs = scoreHistoryKickoffTs(rows);
  const finished = rows.some((r) => String(r.Action ?? "").toLowerCase().includes("finalised"));

  const fixture: Fixture = {
    fixtureId,
    homeTeam,
    awayTeam,
    kickoffAt: new Date(kickoffMs).toISOString(),
    status: finished ? "finished" : "scheduled",
    competition: "World Cup",
  };
  rememberFixtures([fixture]);
  return fixture;
}

export async function warmFixtureMetadata(): Promise<void> {
  bootstrapFixtureMetaSeed();

  if (useLiveTxline()) {
    try {
      const snapshot = await txlineGet<TxlineFixtureRow[]>("/api/fixtures/snapshot");
      const fixtures = snapshot.map((row) => mapFixture(row));
      rememberFixtures(fixtures);
      for (const row of snapshot) {
        bindParticipantIdsFromFixtureRow(row);
      }
    } catch {
      /* snapshot optional */
    }
  }

  try {
    const files = readdirSync(SCORE_ROWS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const fixtureId = file.replace(/\.json$/, "");
      if (lookupArchivedFixture(fixtureId)) continue;
      hydrateFromScoreParticipantIds(fixtureId);
    }
  } catch {
    /* no score dir yet */
  }
}

export async function resolveFixtureMeta(fixtureId: string): Promise<Fixture | null> {
  const seeded = seedFixtureMeta(fixtureId);
  if (seeded) {
    rememberFixtures([seeded]);
    return seeded;
  }

  const archived = lookupArchivedFixture(fixtureId);
  if (archived) return archived;

  const stored = lookupStoredFixture(fixtureId);
  if (stored) return stored;

  const fromScores = hydrateFromScoreParticipantIds(fixtureId);
  if (fromScores) return fromScores;

  if (useLiveTxline()) {
    try {
      const snapshot = await txlineGet<TxlineFixtureRow[]>("/api/fixtures/snapshot");
      const row = snapshot.find((r) => String(r.FixtureId) === fixtureId);
      if (row) {
        const fixture = mapFixture(row);
        rememberFixtures([fixture]);
        bindParticipantIdsFromFixtureRow(row);
        return fixture;
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}
