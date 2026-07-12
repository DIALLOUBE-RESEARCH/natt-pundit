import type {
  EdgeSummaryItem,
  OddsLine,
  ScoresSnapshot,
  SettlementProof,
} from "@natt-pundit/contracts";
import { is1x2Line, only1x2Lines } from "@natt-pundit/natt-core";
import { EDGE_FORMULA_VERSION } from "@natt-pundit/natt-edge-engine";

/**
 * Pure helpers for the append-only data logger (roadmap #4 + #5).
 *
 * Everything here is deterministic and side-effect free so it can be covered by
 * unit + property tests. Disk I/O lives in dataLogger.ts.
 */

export const DATA_STREAMS = ["odds", "scores", "edge", "proof", "ticks", "latency"] as const;
export type DataStream = (typeof DATA_STREAMS)[number];

export type CompactOdd = { market: string; selection: string; implied: number };

export type OddsRecord = { ts: string; fixtureId: string; lines: CompactOdd[] };
export type ScoresRecord = {
  ts: string;
  fixtureId: string;
  status?: string;
  score?: { home: number; away: number };
  clock?: { phase: string; minute?: number };
  events_count: number;
};
export type EdgeRecord = {
  ts: string;
  fixtureId: string;
  verdict: string;
  edge_score: number;
  pi_tx: number;
  pi_model: number;
  c: number;
  direction?: string;
  /** Formula stamp (F70N T7). Absent => pre-F70N-v2 record (contaminated). */
  formulaVersion?: string;
};
export type ProofRecord = {
  ts: string;
  fixtureId: string;
  seq?: number;
  statKey?: number;
  merkleRoot: string;
  leafHash: string;
  validated: boolean;
  programId?: string;
};

/**
 * Perishable data (F70N T1). ticks = per-selection implied series (finer than
 * the whole-fixture odds stream). latency = delay between a live event (goal)
 * and the first odds reaction. Both feed the R&D / CLV lab, not shown on match
 * pages.
 */
export type TickRecord = {
  ts: string;
  fixtureId: string;
  market: string;
  selection: string;
  implied: number;
  decimal: number;
  source?: string;
};
export type LatencyRecord = {
  ts: string;
  fixtureId: string;
  eventType: string;
  tsEvent: string;
  tsReaction: string;
  latencyMs: number;
};

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Merge two odds snapshots keeping the latest line per (market, selection)
 * (F70N T8). The feed sends one market per tick (1X2 / OU / AH / LINE), so a
 * raw overwrite drops the 1X2 lines on an OU tick -> pi_tx collapses -> the
 * SETUP badge flickers. Carrying the last known line per market keeps the 1X2
 * consensus stable. `next` wins on key collisions. Pure.
 */
export function mergeOddsLines(prev: OddsLine[], next: OddsLine[]): OddsLine[] {
  const byKey = new Map<string, OddsLine>();
  for (const l of prev) byKey.set(`${l.market}|${l.selection}`, l);
  for (const l of next) byKey.set(`${l.market}|${l.selection}`, l);
  return [...byKey.values()];
}

/** Home implied on the 1X2 market only. Pure. */
export function homeImplied1x2(
  lines: Array<{ market?: string; selection: string; implied: number }>,
): number | null {
  const h = only1x2Lines(lines).find((l) => l.selection.toLowerCase() === "home");
  return h?.implied ?? null;
}

/**
 * Reject a volatile 1X2 tick (F70N T9). When home implied jumps more than
 * maxJump vs the last accepted stable snapshot, keep the stable 1X2 and only
 * take non-1X2 lines from the incoming tick.
 */
export function stabilize1x2Lines(
  prevStable: OddsLine[],
  incoming: OddsLine[],
  maxJump: number,
): { lines: OddsLine[]; accepted: boolean } {
  const inc1x2 = only1x2Lines(incoming);
  if (inc1x2.length === 0) return { lines: incoming, accepted: false };
  const newHome = homeImplied1x2(inc1x2);
  const oldHome = prevStable.length > 0 ? homeImplied1x2(prevStable) : null;
  if (
    oldHome !== null &&
    newHome !== null &&
    Math.abs(newHome - oldHome) > maxJump
  ) {
    const non1x2 = incoming.filter((l) => !is1x2Line(l));
    return { lines: mergeOddsLines(prevStable, non1x2), accepted: false };
  }
  return { lines: incoming, accepted: true };
}

/** Compact, deterministic odds view (sorted, rounded) for logging. */
export function compactOdds(lines: OddsLine[]): CompactOdd[] {
  return lines
    .map((l) => ({ market: l.market, selection: l.selection, implied: round(l.implied, 4) }))
    .sort((a, b) =>
      a.market === b.market
        ? a.selection.localeCompare(b.selection)
        : a.market.localeCompare(b.market),
    );
}

/** Signature strings drive dedup: only append when the meaningful state changes. */
export function oddsSignature(lines: OddsLine[]): string {
  return compactOdds(lines)
    .map((l) => `${l.market}:${l.selection}=${l.implied}`)
    .join("|");
}

export function scoresSignature(item: EdgeSummaryItem): string {
  const s = item.score ? `${item.score.home}-${item.score.away}` : "na";
  return `${item.status ?? "na"}|${s}|${item.clock?.phase ?? "na"}|${item.clock?.minute ?? "na"}`;
}

export function edgeSignature(item: EdgeSummaryItem): string {
  return `${item.verdict}|${round(item.edge_score, 3)}|${item.direction ?? "none"}`;
}

/** Proof stream is append-only unique: one line per new (seq, merkleRoot). */
export function proofSignature(proof: SettlementProof): string {
  return `${proof.seq ?? "na"}|${proof.merkleRoot}`;
}

/**
 * Decide whether a new record should be appended given the last logged
 * signature for that (stream, fixture). Undefined prev => always log.
 */
export function shouldLog(prevSig: string | undefined, nextSig: string): boolean {
  return prevSig !== nextSig;
}

export function oddsRecord(ts: string, fixtureId: string, lines: OddsLine[]): OddsRecord {
  return { ts, fixtureId, lines: compactOdds(lines) };
}

export function scoresRecord(ts: string, item: EdgeSummaryItem): ScoresRecord {
  return {
    ts,
    fixtureId: item.fixtureId,
    status: item.status,
    score: item.score,
    clock: item.clock ? { phase: item.clock.phase, minute: item.clock.minute } : undefined,
    events_count: 0,
  };
}

export function scoresRecordFromSnapshot(
  ts: string,
  item: EdgeSummaryItem,
  scores: ScoresSnapshot | null,
): ScoresRecord {
  return { ...scoresRecord(ts, item), events_count: scores?.events.length ?? 0 };
}

export function edgeRecord(ts: string, item: EdgeSummaryItem): EdgeRecord {
  return {
    ts,
    fixtureId: item.fixtureId,
    verdict: item.verdict,
    edge_score: round(item.edge_score, 6),
    pi_tx: round(item.pi_tx, 6),
    pi_model: round(item.pi_model, 6),
    c: round(item.c, 6),
    direction: item.direction,
    formulaVersion: EDGE_FORMULA_VERSION,
  };
}

export function proofRecord(ts: string, proof: SettlementProof): ProofRecord {
  return {
    ts,
    fixtureId: proof.fixtureId,
    seq: proof.seq,
    statKey: proof.statKey,
    merkleRoot: proof.merkleRoot,
    leafHash: proof.leafHash,
    validated: proof.validated,
    programId: proof.programId,
  };
}

/** Fair decimal odds from an implied probability (0 when implied invalid). */
export function impliedToDecimal(implied: number): number {
  if (!(implied > 0)) return 0;
  return round(1 / implied, 4);
}

/** Dedup key for the tick stream: one series per (fixture, market, selection). */
export function tickKey(fixtureId: string, market: string, selection: string): string {
  return `${fixtureId}|${market}|${selection}`;
}

/** Tick dedup signature: only append when the rounded implied actually moves. */
export function tickSignature(implied: number): string {
  return String(round(implied, 4));
}

/** One tick record per selection present in the odds lines. */
export function tickRecords(ts: string, fixtureId: string, lines: OddsLine[]): TickRecord[] {
  return compactOdds(lines).map((l) => ({
    ts,
    fixtureId,
    market: l.market,
    selection: l.selection,
    implied: l.implied,
    decimal: impliedToDecimal(l.implied),
  }));
}

/** Total goals in a snapshot item (0 when score absent). */
export function scoreTotal(item: EdgeSummaryItem): number {
  return item.score ? item.score.home + item.score.away : 0;
}

export function latencyRecord(
  ts: string,
  fixtureId: string,
  eventType: string,
  tsEvent: string,
  tsReaction: string,
): LatencyRecord {
  const latencyMs = Math.max(
    0,
    new Date(tsReaction).getTime() - new Date(tsEvent).getTime(),
  );
  return { ts, fixtureId, eventType, tsEvent, tsReaction, latencyMs };
}

export type ClvSample = {
  fixtureId: string;
  direction: string;
  fairEntry: number;
  fairClose: number;
};

/**
 * Reconstruct CLV samples from the edge log (F70N T2). For each fixture that
 * produced a candidate setup, entry = market fair prob (pi_tx) of the picked
 * side when first flagged; close = the last logged pi_tx for that same side.
 * CLV then measures whether the closing line moved toward our pick. Pure.
 */
export function buildClvSamples(edgeRecords: EdgeRecord[]): ClvSample[] {
  const byFixture = new Map<string, EdgeRecord[]>();
  for (const r of edgeRecords) {
    const arr = byFixture.get(r.fixtureId) ?? [];
    arr.push(r);
    byFixture.set(r.fixtureId, arr);
  }

  const samples: ClvSample[] = [];
  for (const [fid, recs] of byFixture) {
    const sorted = [...recs].sort((a, b) => a.ts.localeCompare(b.ts));
    const entry = sorted.find(
      (r) =>
        (r.verdict === "SETUP" || r.verdict === "SETUP_CANDIDATE") &&
        r.direction !== undefined &&
        r.direction !== "none",
    );
    if (!entry) continue;
    let close: EdgeRecord | undefined;
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      if (sorted[i]!.direction === entry.direction) {
        close = sorted[i];
        break;
      }
    }
    if (!close || close.ts === entry.ts) continue;
    samples.push({
      fixtureId: fid,
      direction: entry.direction!,
      fairEntry: entry.pi_tx,
      fairClose: close.pi_tx,
    });
  }
  return samples;
}

export type FairForFn = (
  lines: Array<{ selection: string; implied: number }>,
  selection: "home" | "away" | "draw",
) => number | null;

/**
 * CLV samples reconstructed from the ODDS series (F70N T7) — the honest fix.
 *
 * entry  = first CLEAN candidate setup for a fixture (formulaVersion match +
 *          directional). fairEntry = Shin fair prob of that direction at the
 *          first odds snapshot at/after the flag.
 * close  = Shin fair prob of the SAME direction at the LAST odds snapshot.
 *
 * Fixes two contamination bugs of buildClvSamples: (1) pre-F70N-v2 records
 * (favorite-detector) are dropped via formulaVersion, (2) the close is the real
 * last market line, not a sparse dedup'd edge record. Pure (fairFor injected).
 */
export function buildClvSamplesFromOdds(
  edgeRecords: EdgeRecord[],
  oddsRecords: OddsRecord[],
  fairFor: FairForFn,
  opts: { formulaVersion?: string; minEdge?: number } = {},
): ClvSample[] {
  const minEdge = opts.minEdge ?? 0;
  const isDir = (d?: string): d is "home" | "away" | "draw" =>
    d === "home" || d === "away" || d === "draw";

  const edgeByFixture = new Map<string, EdgeRecord[]>();
  for (const r of edgeRecords) {
    if (opts.formulaVersion && r.formulaVersion !== opts.formulaVersion) continue;
    const arr = edgeByFixture.get(r.fixtureId) ?? [];
    arr.push(r);
    edgeByFixture.set(r.fixtureId, arr);
  }

  const oddsByFixture = new Map<string, OddsRecord[]>();
  for (const o of oddsRecords) {
    const arr = oddsByFixture.get(o.fixtureId) ?? [];
    arr.push(o);
    oddsByFixture.set(o.fixtureId, arr);
  }
  for (const arr of oddsByFixture.values()) arr.sort((a, b) => a.ts.localeCompare(b.ts));

  const samples: ClvSample[] = [];
  for (const [fid, recs] of edgeByFixture) {
    const sorted = [...recs].sort((a, b) => a.ts.localeCompare(b.ts));
    const entry = sorted.find(
      (r) =>
        (r.verdict === "SETUP" || r.verdict === "SETUP_CANDIDATE") &&
        isDir(r.direction) &&
        r.edge_score > minEdge,
    );
    if (!entry || !isDir(entry.direction)) continue;

    const oddsArr = oddsByFixture.get(fid);
    if (!oddsArr || oddsArr.length === 0) continue;
    const entryOdds = oddsArr.find((o) => o.ts >= entry.ts);
    const closeOdds = oddsArr[oddsArr.length - 1]!;
    if (!entryOdds || closeOdds.ts <= entryOdds.ts) continue;

    const fairEntry = fairFor(entryOdds.lines, entry.direction);
    const fairClose = fairFor(closeOdds.lines, entry.direction);
    if (fairEntry === null || fairClose === null) continue;
    if (!(fairEntry > 0) || !(fairClose > 0)) continue;

    samples.push({ fixtureId: fid, direction: entry.direction, fairEntry, fairClose });
  }
  return samples;
}
