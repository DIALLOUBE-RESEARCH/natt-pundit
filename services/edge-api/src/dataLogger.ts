import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import type {
  EdgeSummaryItem,
  Fixture,
  OddsLine,
  ScoresSnapshot,
  SettlementProof,
} from "@natt-pundit/contracts";
import {
  buildClvSamplesFromOdds,
  DATA_STREAMS,
  type DataStream,
  type EdgeRecord,
  type OddsRecord,
  type ProofRecord,
  edgeRecord,
  edgeSignature,
  latencyRecord,
  oddsRecord,
  oddsSignature,
  proofRecord,
  proofSignature,
  scoreTotal,
  scoresRecordFromSnapshot,
  scoresSignature,
  shouldLog,
  tickKey,
  tickRecords,
  tickSignature,
} from "./dataLog.js";
import { fairProbForSelection } from "@natt-pundit/natt-core";
import {
  CLV_BLOCK_SIZE,
  CLV_BOOTSTRAP_ITERS,
  CLV_MIN_DISPLAY,
  CLV_SEED,
  clvVerdict,
  computeClv,
  EDGE_FORMULA_VERSION,
  EPSILON_NET,
  meanClvWithCi,
  N_MIN_FIT,
} from "@natt-pundit/natt-edge-engine";

const DATA_DIR = process.env.DATA_LOG_DIR ?? "/data";
const INTERVAL_MS = Number(process.env.DATA_LOG_INTERVAL_MS ?? 60_000);
const MAX_LINES = Number(process.env.DATA_LOG_MAX_LINES ?? 200_000);
const ENABLED = process.env.DATA_LOG_ENABLED !== "false";
// A registered goal event is dropped if no odds reaction happens within this
// window (avoids attributing unrelated later moves). Resolution of latencyMs is
// bounded by INTERVAL_MS (polling), documented limitation.
const LATENCY_MAX_MS = Number(process.env.DATA_LOG_LATENCY_MAX_MS ?? 900_000);

export type StreamState = { records: number; firstTs?: string; lastTs?: string };
export type LoggerDeps = {
  fetchFixturesList: () => Promise<Fixture[]>;
  fetchOdds: (fixtureId: string) => Promise<OddsLine[]>;
  fetchScores: (fixtureId: string) => Promise<ScoresSnapshot | null>;
  fetchProof: (fixtureId: string) => Promise<SettlementProof | null>;
  buildEdgeItem: (
    fixture: Fixture,
    lines: OddsLine[],
    scores: ScoresSnapshot | null,
  ) => EdgeSummaryItem;
};

const state: Record<DataStream, StreamState> = {
  odds: { records: 0 },
  scores: { records: 0 },
  edge: { records: 0 },
  proof: { records: 0 },
  ticks: { records: 0 },
  latency: { records: 0 },
};

// Last logged signature per (stream, key) for dedup.
// ticks are keyed per (fixtureId, market, selection); others per fixtureId.
const lastSig: Record<DataStream, Map<string, string>> = {
  odds: new Map(),
  scores: new Map(),
  edge: new Map(),
  proof: new Map(),
  ticks: new Map(),
  latency: new Map(),
};

// Latency tracking: last observed goal total per fixture + a pending goal event
// awaiting the first odds reaction.
const lastScoreTotal = new Map<string, number>();
const pendingEvent = new Map<string, { eventType: string; tsEvent: string }>();

function streamPath(stream: DataStream): string {
  return join(DATA_DIR, `${stream}.jsonl`);
}

function readFirstLastTs(path: string): { count: number; firstTs?: string; lastTs?: string } {
  try {
    const raw = readFileSync(path, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { count: 0 };
    const parseTs = (l: string): string | undefined => {
      try {
        return (JSON.parse(l) as { ts?: string }).ts;
      } catch {
        return undefined;
      }
    };
    return { count: lines.length, firstTs: parseTs(lines[0]), lastTs: parseTs(lines[lines.length - 1]) };
  } catch {
    return { count: 0 };
  }
}

/** Seed in-memory index + dedup from any existing files (survives restart). */
function seedFromDisk(): void {
  for (const stream of DATA_STREAMS) {
    const { count, firstTs, lastTs } = readFirstLastTs(streamPath(stream));
    state[stream] = { records: count, firstTs, lastTs };
  }
}

function rotateIfNeeded(stream: DataStream): void {
  if (state[stream].records < MAX_LINES) return;
  const path = streamPath(stream);
  try {
    let n = 1;
    // Find a free rotation slot: odds.1.jsonl, odds.2.jsonl, ...
    // statSync throws when missing -> that's our target.
    // Bounded loop avoids infinite spin on weird FS state.
    for (; n < 10_000; n += 1) {
      const candidate = join(DATA_DIR, `${stream}.${n}.jsonl`);
      try {
        statSync(candidate);
      } catch {
        renameSync(path, candidate);
        break;
      }
    }
    state[stream] = { records: 0 };
  } catch (err) {
    console.warn(`[dataLogger] rotate ${stream} failed: ${err instanceof Error ? err.message : "?"}`);
  }
}

function append(stream: DataStream, record: { ts: string }): void {
  rotateIfNeeded(stream);
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(streamPath(stream), `${JSON.stringify(record)}\n`, "utf8");
    const s = state[stream];
    s.records += 1;
    if (!s.firstTs) s.firstTs = record.ts;
    s.lastTs = record.ts;
  } catch (err) {
    console.warn(`[dataLogger] append ${stream} failed: ${err instanceof Error ? err.message : "?"}`);
  }
}

function logIfChanged(
  stream: DataStream,
  fixtureId: string,
  sig: string,
  build: () => { ts: string },
): void {
  if (!shouldLog(lastSig[stream].get(fixtureId), sig)) return;
  append(stream, build());
  lastSig[stream].set(fixtureId, sig);
}

/**
 * Register a goal event when the score total increases, then emit a latency
 * record on the first odds reaction in a LATER tick. Resolution is bounded by
 * the polling interval (fail-open, best-effort telemetry).
 */
function trackLatency(
  ts: string,
  fixtureId: string,
  item: Parameters<typeof scoreTotal>[0],
  oddsChanged: boolean,
): void {
  const total = scoreTotal(item);
  const prevTotal = lastScoreTotal.get(fixtureId);
  if (prevTotal !== undefined && total > prevTotal) {
    pendingEvent.set(fixtureId, { eventType: "goal", tsEvent: ts });
  }
  lastScoreTotal.set(fixtureId, total);

  const pending = pendingEvent.get(fixtureId);
  if (!pending) return;

  const age = new Date(ts).getTime() - new Date(pending.tsEvent).getTime();
  if (age > LATENCY_MAX_MS) {
    pendingEvent.delete(fixtureId);
    return;
  }
  // Only count a reaction observed in a strictly later tick than the event.
  if (oddsChanged && pending.tsEvent !== ts) {
    append("latency", latencyRecord(ts, fixtureId, pending.eventType, pending.tsEvent, ts));
    pendingEvent.delete(fixtureId);
  }
}

async function tickOnce(deps: LoggerDeps): Promise<void> {
  const ts = new Date().toISOString();
  const fixtures = await deps.fetchFixturesList();
  for (const fixture of fixtures) {
    const fid = fixture.fixtureId;
    try {
      const [lines, scores, proof] = await Promise.all([
        deps.fetchOdds(fid),
        deps.fetchScores(fid),
        deps.fetchProof(fid),
      ]);
      const item = deps.buildEdgeItem(fixture, lines, scores);

      // Detect whether odds moved this tick BEFORE logIfChanged mutates lastSig.
      const oddsSig = lines.length > 0 ? oddsSignature(lines) : null;
      const oddsChanged = oddsSig !== null && oddsSig !== lastSig.odds.get(fid);

      if (lines.length > 0 && oddsSig !== null) {
        logIfChanged("odds", fid, oddsSig, () => oddsRecord(ts, fid, lines));
        // Per-selection high-frequency ticks (finer than the odds stream).
        for (const tr of tickRecords(ts, fid, lines)) {
          const key = tickKey(fid, tr.market, tr.selection);
          const sig = tickSignature(tr.implied);
          if (shouldLog(lastSig.ticks.get(key), sig)) {
            append("ticks", tr);
            lastSig.ticks.set(key, sig);
          }
        }
      }
      logIfChanged("scores", fid, scoresSignature(item), () =>
        scoresRecordFromSnapshot(ts, item, scores),
      );
      logIfChanged("edge", fid, edgeSignature(item), () => edgeRecord(ts, item));
      if (proof && proof.merkleRoot) {
        logIfChanged("proof", fid, proofSignature(proof), () => proofRecord(ts, proof));
      }

      trackLatency(ts, fid, item, oddsChanged);
    } catch (err) {
      // Per-fixture failure must never break the loop (observe-only telemetry).
      console.warn(`[dataLogger] fixture ${fid} skipped: ${err instanceof Error ? err.message : "?"}`);
    }
  }
}

export function getDataIndex(): {
  streams: Array<{ name: DataStream; records: number; bytes: number; firstTs?: string; lastTs?: string }>;
  generatedAt: string;
} {
  const streams = DATA_STREAMS.map((name) => {
    let bytes = 0;
    try {
      bytes = statSync(streamPath(name)).size;
    } catch {
      bytes = 0;
    }
    return { name, ...state[name], bytes };
  });
  return { streams, generatedAt: new Date().toISOString() };
}

export function streamFilePath(stream: DataStream): string {
  return streamPath(stream);
}

function readStreamRecords<T>(stream: DataStream): T[] {
  try {
    const raw = readFileSync(streamPath(stream), "utf8");
    return raw
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as T);
  } catch {
    return [];
  }
}

/**
 * CLV verdict (F70N T2, reconstruction fixed in T7). Honest by design:
 * - only CLEAN samples (formulaVersion === EDGE_FORMULA_VERSION) are used, so
 *   pre-fix favorite-detector setups no longer pollute the mean;
 * - entry/close fair probs come from the ODDS series (true closing line), not
 *   the sparse edge log;
 * - below CLV_MIN_DISPLAY samples the mean/CI are flagged `indicative` (noise),
 *   and certification still requires N_MIN_FIT with a positive lower bound.
 */
export function getClvVerdict(): {
  verdict: string;
  n: number;
  nMin: number;
  nMinDisplay: number;
  indicative: boolean;
  meanClv: number;
  ciLo: number;
  ciHi: number;
  pctBeats: number;
  formulaVersion: string;
  generatedAt: string;
} {
  const edgeRecs = readStreamRecords<EdgeRecord>("edge");
  const oddsRecs = readStreamRecords<OddsRecord>("odds");
  const samples = buildClvSamplesFromOdds(
    edgeRecs,
    oddsRecs,
    (lines, sel) => fairProbForSelection(lines, sel),
    { formulaVersion: EDGE_FORMULA_VERSION, minEdge: EPSILON_NET },
  );
  const values = samples.map((s) => computeClv(s.fairEntry, s.fairClose));
  const ci = meanClvWithCi(values, {
    iters: CLV_BOOTSTRAP_ITERS,
    blockSize: CLV_BLOCK_SIZE,
    seed: CLV_SEED,
  });
  const beats = values.filter((v) => v > 0).length;
  return {
    verdict: clvVerdict(ci, N_MIN_FIT),
    n: values.length,
    nMin: N_MIN_FIT,
    nMinDisplay: CLV_MIN_DISPLAY,
    indicative: values.length < CLV_MIN_DISPLAY,
    meanClv: ci.mean,
    ciLo: ci.lo,
    ciHi: ci.hi,
    pctBeats: values.length > 0 ? beats / values.length : 0,
    formulaVersion: EDGE_FORMULA_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

/** Recent Merkle anchors from the proof log, most recent first (F70N /datas). */
export function getRecentProofs(limit = 12): {
  proofs: ProofRecord[];
  total: number;
  generatedAt: string;
} {
  const all = readStreamRecords<ProofRecord>("proof");
  const proofs = [...all].reverse().slice(0, Math.max(0, limit));
  return { proofs, total: all.length, generatedAt: new Date().toISOString() };
}

/** Start the periodic logger. No-op when DATA_LOG_ENABLED=false. */
export function startDataLogger(deps: LoggerDeps): void {
  if (!ENABLED) {
    console.log("[dataLogger] disabled");
    return;
  }
  seedFromDisk();
  const run = () => {
    void tickOnce(deps).catch((err) =>
      console.warn(`[dataLogger] tick failed: ${err instanceof Error ? err.message : "?"}`),
    );
  };
  // First tick shortly after boot, then on interval.
  setTimeout(run, 5_000);
  setInterval(run, INTERVAL_MS);
  console.log(`[dataLogger] started dir=${DATA_DIR} interval=${INTERVAL_MS}ms`);
}
