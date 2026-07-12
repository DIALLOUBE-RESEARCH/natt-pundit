import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { TxlineScoreRow } from "./txlineMap.js";

/**
 * TxLINE `/api/scores/snapshot/{id}` is a rolling window — early goals drop out.
 * Merge each poll into disk-backed history so timeline minutes stay honest.
 */

const STORE_DIR = process.env.SCORE_ROWS_STORE_DIR ?? "/data/score-rows";
const RETENTION_MS =
  Number(process.env.SCORE_ROWS_RETENTION_HOURS ?? 48) * 60 * 60 * 1000;
const MAX_ROWS_PER_FIXTURE = Number(process.env.SCORE_ROWS_MAX ?? 4000);

function storePath(fixtureId: string): string {
  return join(STORE_DIR, `${fixtureId}.json`);
}

function rowSeq(r: TxlineScoreRow): number | undefined {
  const candidates = [r.Seq, r.Data?.seq, r.Data?.Seq, r.Data?.updateSeq];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return Math.trunc(c);
  }
  return undefined;
}

export function maxRowSeq(rows: TxlineScoreRow[]): number | null {
  let max: number | null = null;
  for (const r of rows) {
    const seq = rowSeq(r);
    if (seq !== undefined && (max === null || seq > max)) max = seq;
  }
  return max;
}

function rowKey(r: TxlineScoreRow): string {
  const seq = rowSeq(r);
  if (seq !== undefined) return `seq:${seq}`;
  const data = r.Data ?? {};
  const pid = data.PlayerId ?? data.PlayerInId ?? data.PlayerOutId ?? "";
  return `${r.Ts}|${r.Action ?? ""}|${r.Participant ?? ""}|${pid}|${r.StatusId ?? ""}`;
}

function kickoffFromRows(rows: TxlineScoreRow[]): number {
  const kick = rows.find((r) => (r.Action ?? "").toLowerCase().includes("kickoff"));
  return kick?.Ts ?? rows[0]?.Ts ?? Date.now();
}

export function mergeScoreRows(
  fixtureId: string,
  snapshot: TxlineScoreRow[],
  prev: TxlineScoreRow[] = loadScoreRows(fixtureId),
  now: number = Date.now(),
): TxlineScoreRow[] {
  const map = new Map<string, TxlineScoreRow>();
  const cutoff = now - RETENTION_MS;

  for (const r of prev) {
    if (r.Ts >= cutoff) map.set(rowKey(r), r);
  }
  for (const r of snapshot) {
    map.set(rowKey(r), r);
  }

  let merged = [...map.values()].sort((a, b) => a.Ts - b.Ts);
  if (merged.length > MAX_ROWS_PER_FIXTURE) {
    merged = merged.slice(-MAX_ROWS_PER_FIXTURE);
  }
  persistScoreRows(fixtureId, merged);
  return merged;
}

export function loadScoreRows(fixtureId: string): TxlineScoreRow[] {
  try {
    const raw = readFileSync(storePath(fixtureId), "utf8");
    const parsed = JSON.parse(raw) as TxlineScoreRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistScoreRows(fixtureId: string, rows: TxlineScoreRow[]): void {
  try {
    const path = storePath(fixtureId);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(rows), "utf8");
  } catch (err) {
    console.warn(
      `[scoreStore] persist ${fixtureId} failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

export function reconcileScoreRows(fixtureId: string, snapshot: TxlineScoreRow[]): TxlineScoreRow[] {
  if (!snapshot.length) return loadScoreRows(fixtureId);
  return mergeScoreRows(fixtureId, snapshot);
}

/** Test helper — earliest kickoff anchor for a fixture history. */
export function scoreHistoryKickoffTs(rows: TxlineScoreRow[]): number {
  return kickoffFromRows(rows);
}
