import type { SettlementProof } from "@natt-pundit/contracts";
import { SettlementProofSchema } from "@natt-pundit/contracts";
import {
  TXLINE_PROGRAM_ID,
  hashToBytes,
  verifyTxlineSettlementProof,
  statsImplyOutcome,
  validationMatchesCpiTarget,
  validationIsRegulationTie,
  txlineHomeAwayStatKeys,
  txlineHomeAwayPenKeys,
  type CpiScoreTarget,
  type EscrowOutcome,
  type MerkleProofNode,
  type TxlineHomeAwayStatKeys,
} from "@natt-pundit/natt-core";
import { fetchScoreUpdates, parseTxlineSsePayload, txlineGet } from "./txlineClient.js";
import { getFixtureScores } from "./txline.js";
import { loadScoreRows, maxRowSeq } from "./scoreStore.js";
import { escrowTxlineGet, escrowCluster } from "./txlineEscrowClient.js";
import type { EscrowCluster } from "@natt-pundit/natt-core";
import { txlineApiBase } from "@natt-pundit/natt-core";
import type { TxlineScoreRow } from "./txlineMap.js";

type ProofNode = { hash: string | number[] | Uint8Array; isRightSibling: boolean };

const proofCache = new Map<string, SettlementProof>();
const seqCache = new Map<string, number>();

function readParticipant1IsHome(fixtureId: string): boolean {
  let p1IsHome = true;
  try {
    for (const row of loadScoreRows(fixtureId)) {
      if (typeof row.Participant1IsHome === "boolean") p1IsHome = row.Participant1IsHome;
    }
  } catch {
    /* no local store */
  }
  return p1IsHome;
}

const CPI_SEQ_SCAN_CAP = 48;

function isProofPendingMessage(message: string): boolean {
  return (
    message === "proof_pending_first_score" ||
    message === "proof_pending_no_snapshot" ||
    message === "no_score_seq"
  );
}

type TxlineStatValidation = {
  summary?: {
    fixtureId: number;
    updateStats?: { updateCount: number; minTimestamp: number; maxTimestamp: number };
    eventStatsSubTreeRoot?: string | number[] | Uint8Array;
  };
  subTreeProof?: ProofNode[];
  mainTreeProof?: ProofNode[];
  statToProve?: { key: number; value: number; period: number };
  statToProve2?: { key: number; value: number; period: number };
  eventStatRoot?: string | number[] | Uint8Array;
  statProof?: ProofNode[];
  statProof2?: ProofNode[];
};

/** Solana Explorer link to the on-chain program that anchors the Merkle roots.
 * Used when no settlement txSig is known yet (the panel prefers a tx link). */
function programExplorerUrl(): string | undefined {
  if (!TXLINE_PROGRAM_ID) return undefined;
  return `https://explorer.solana.com/address/${TXLINE_PROGRAM_ID}`;
}

function hashToHex(hash: string | number[] | Uint8Array | undefined | null): string {
  if (hash === null || hash === undefined) return "0x0";
  const bytes = hashToBytes(hash);
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

function proofPath(nodes: ProofNode[] | undefined): string[] {
  if (!nodes?.length) return [];
  return nodes.map((n) => hashToHex(n.hash));
}

function mapProofNodes(nodes: ProofNode[] | undefined): MerkleProofNode[] {
  if (!nodes?.length) return [];
  return nodes.map((n) => ({
    hash: hashToBytes(n.hash),
    isRightSibling: Boolean(n.isRightSibling),
  }));
}

function statValueFromPayload(stat: unknown): string {
  if (stat === null || stat === undefined) return "unknown";
  if (typeof stat === "string" || typeof stat === "number" || typeof stat === "boolean") {
    return String(stat);
  }
  if (typeof stat === "object") {
    const obj = stat as Record<string, unknown>;
    for (const key of ["value", "statValue", "goals", "score"]) {
      if (obj[key] !== undefined) return String(obj[key]);
    }
    return JSON.stringify(stat).slice(0, 120);
  }
  return String(stat);
}

type TxlineScoreUpdate = {
  Seq?: number;
  seq?: number;
  FixtureId?: number;
};

async function resolveSeq(fixtureId: string): Promise<number | null> {
  let maxSeq: number | null = null;
  try {
    const updates = await txlineGet<TxlineScoreUpdate[]>(`/api/scores/updates/${fixtureId}`);
    for (const row of updates) {
      const candidate = row.Seq ?? row.seq;
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        const seq = Math.trunc(candidate);
        if (maxSeq === null || seq > maxSeq) maxSeq = seq;
      }
    }
    if (maxSeq !== null) return maxSeq;
  } catch {
    /* try snapshot */
  }

  let scoreRows: TxlineScoreRow[] = [];
  try {
    scoreRows = await txlineGet<TxlineScoreRow[]>(`/api/scores/snapshot/${fixtureId}`);
  } catch {
    return null;
  }

  if (scoreRows.length === 0) return null;

  const fromSnapshot = extractSeq(scoreRows);
  if (fromSnapshot !== null) return fromSnapshot;

  // Live 0-0: snapshot exists but updates empty — anchor at seq 0
  return 0;
}

function extractSeq(rows: TxlineScoreRow[]): number | null {
  const sorted = [...rows].sort((a, b) => b.Ts - a.Ts);
  for (const row of sorted) {
    const data = row.Data ?? {};
    const candidates = [
      data.seq,
      data.Seq,
      data.sequence,
      data.updateSeq,
      (row as { Seq?: number }).Seq,
    ];
    for (const c of candidates) {
      if (typeof c === "number" && Number.isFinite(c) && c >= 0) {
        return Math.trunc(c);
      }
    }
  }
  return null;
}

function mockProof(fixtureId: string): SettlementProof {
  const ts = new Date().toISOString();
  return SettlementProofSchema.parse({
    fixtureId,
    merkleRoot: `0xmock_root_${fixtureId.slice(0, 8)}`,
    leafHash: `0xmock_leaf_${fixtureId.slice(0, 8)}`,
    proof: ["0xmock_proof_a", "0xmock_proof_b"],
    statType: "final_score",
    statValue: "mock_pending",
    validated: false,
    source: "mock",
    chain: "solana",
    programId: TXLINE_PROGRAM_ID,
    explorerUrl: programExplorerUrl(),
    ts,
  });
}

function resolveMerkleRoot(validation: TxlineStatValidation): Uint8Array {
  const mainNodes = validation.mainTreeProof ?? [];
  const terminal = mainNodes[mainNodes.length - 1];
  if (terminal) return hashToBytes(terminal.hash);
  if (validation.summary?.eventStatsSubTreeRoot) {
    return hashToBytes(validation.summary.eventStatsSubTreeRoot);
  }
  return hashToBytes(validation.eventStatRoot);
}

function runMerkleVerify(validation: TxlineStatValidation): { valid: boolean; reason: string } {
  const summaryRoot = validation.summary?.eventStatsSubTreeRoot;
  const eventStatRoot = validation.eventStatRoot;
  const statToProve = validation.statToProve;

  if (!summaryRoot || !eventStatRoot || !statToProve) {
    return { valid: false, reason: "incomplete_validation_payload" };
  }

  return verifyTxlineSettlementProof({
    statToProve,
    statToProve2: validation.statToProve2,
    eventStatRoot: hashToBytes(eventStatRoot),
    statProof: mapProofNodes(validation.statProof),
    statProof2: mapProofNodes(validation.statProof2),
    subTreeProof: mapProofNodes(validation.subTreeProof),
    mainTreeProof: mapProofNodes(validation.mainTreeProof),
    summarySubTreeRoot: hashToBytes(summaryRoot),
    merkleRoot: resolveMerkleRoot(validation),
  });
}

function isZeroLeafHash(hex: string): boolean {
  const stripped = hex.toLowerCase().replace(/^0x/, "");
  return stripped.length > 0 && /^0+$/.test(stripped);
}

function shouldTreatAsPrematchPending(
  scores: Awaited<ReturnType<typeof getFixtureScores>>,
  proof: SettlementProof,
): boolean {
  if (proof.validated || proof.source !== "txline") return false;
  const phase = scores?.clock?.phase ?? "pre";
  if (phase === "FT") return false;
  if (proof.verifyReason === "proof_pending_prematch") return true;
  return (
    proof.verifyReason === "stat_proof_mismatch" &&
    proof.statValue === "0/0" &&
    isZeroLeafHash(proof.leafHash)
  );
}

function mapValidationToProof(
  fixtureId: string,
  validation: TxlineStatValidation,
  seq: number,
  statKey: number,
  verifyReason: string,
): SettlementProof {
  const ts = new Date().toISOString();
  const merkleRootBytes = resolveMerkleRoot(validation);
  const leaf = validation.eventStatRoot ?? validation.statProof?.[0]?.hash ?? "0x0";
  const path = [
    ...proofPath(validation.statProof),
    ...proofPath(validation.subTreeProof),
    ...proofPath(validation.mainTreeProof),
  ];
  const verify = runMerkleVerify(validation);
  const statFields = formatStatFields(validation, statKey);

  return SettlementProofSchema.parse({
    fixtureId,
    merkleRoot: hashToHex(merkleRootBytes),
    leafHash: hashToHex(leaf),
    proof: path.length ? path : ["0x0"],
    statType: statFields.statType,
    statValue: statFields.statValue,
    validated: verify.valid,
    verifyReason: verify.valid ? "ok" : verifyReason,
    source: "txline",
    chain: "solana",
    programId: TXLINE_PROGRAM_ID,
    explorerUrl: programExplorerUrl(),
    seq,
    statKey,
    ts,
  });
}

async function fetchStatValidation(
  fid: number,
  seq: number,
  statKey: number,
  statKey2?: number,
): Promise<TxlineStatValidation | null> {
  try {
    const query = new URLSearchParams({
      fixtureId: String(fid),
      seq: String(seq),
      statKey: String(statKey),
    });
    if (statKey2 !== undefined) {
      query.set("statKey2", String(statKey2));
    }
    return await txlineGet<TxlineStatValidation>(
      `/api/scores/stat-validation?${query.toString()}`,
    );
  } catch {
    return null;
  }
}

async function listSeqCandidates(fixtureId: string, preferredSeq: number): Promise<number[]> {
  const seen = new Set<number>([preferredSeq, 0]);

  try {
    const updates = await fetchScoreUpdates<TxlineScoreUpdate>(fixtureId);
    for (const row of updates) {
      const candidate = row.Seq ?? row.seq;
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        seen.add(Math.trunc(candidate));
      }
    }
  } catch {
    /* snapshot-only fixture */
  }

  for (const cluster of ["mainnet", "devnet"] as EscrowCluster[]) {
    for (const row of await loadEscrowSnapshotRows(fixtureId, cluster)) {
      if (typeof row.Seq === "number") seen.add(Math.trunc(row.Seq));
      const data = row.Data ?? {};
      for (const key of ["seq", "Seq", "sequence", "updateSeq"] as const) {
        const candidate = data[key];
        if (typeof candidate === "number" && Number.isFinite(candidate)) {
          seen.add(Math.trunc(candidate));
        }
      }
      const action = (row.Action ?? "").toLowerCase();
      if (action.includes("game_finalis") || action.includes("fulltime_finalis")) {
        const seq = row.Seq ?? data.Seq ?? data.seq;
        if (typeof seq === "number") seen.add(Math.trunc(seq));
      }
    }
  }

  try {
    const rows = loadScoreRows(fixtureId);
    const mx = maxRowSeq(rows);
    if (mx !== null) seen.add(mx);
  } catch {
    /* no local store */
  }

  return [...seen].sort((a, b) => b - a);
}

async function loadEscrowSnapshotRows(
  fixtureId: string,
  cluster: EscrowCluster,
): Promise<TxlineScoreRow[]> {
  try {
    const base = txlineApiBase(cluster);
    const raw = await fetch(`${base}/api/scores/snapshot/${fixtureId}`, {
      headers: await escrowSnapshotHeaders(cluster),
    });
    if (!raw.ok) return [];
    const text = await raw.text();
    return parseTxlineSsePayload<TxlineScoreRow>(text);
  } catch {
    return [];
  }
}

async function escrowSnapshotHeaders(cluster: EscrowCluster): Promise<Record<string, string>> {
  const base = txlineApiBase(cluster);
  const res = await fetch(`${base}/auth/guest/start`, { method: "POST" });
  const { token } = (await res.json()) as { token: string };
  const apiTok =
    cluster === "devnet"
      ? process.env.TXLINE_DEV_API_TOKEN?.trim() || process.env.TXLINE_API_TOKEN?.trim() || ""
      : process.env.TXLINE_API_TOKEN?.trim() || "";
  return {
    Authorization: `Bearer ${token}`,
    "X-Api-Token": apiTok,
  };
}

type TargetScore = { home: number; away: number };

function validationMatchesScore(
  validation: TxlineStatValidation,
  target: TargetScore,
  statKeys: TxlineHomeAwayStatKeys,
): boolean {
  const home = validation.statToProve?.value;
  const away = validation.statToProve2?.value;
  if (home === undefined) return false;
  if (away !== undefined) return home === target.home && away === target.away;
  return validation.statToProve?.key === statKeys.homeStatKey && home === target.home;
}

function formatStatFields(
  validation: TxlineStatValidation,
  statKey: number,
): { statType: string; statValue: string } {
  if (validation.statToProve2 && validation.statToProve) {
    return {
      statType: `stat_${validation.statToProve.key}/stat_${validation.statToProve2.key}`,
      statValue: `${validation.statToProve.value}/${validation.statToProve2.value}`,
    };
  }
  return {
    statType: `stat_${statKey}`,
    statValue: statValueFromPayload(validation.statToProve),
  };
}

async function resolveStatValidation(
  fid: number,
  preferredSeq: number,
  target: TargetScore | undefined,
  statKeys: TxlineHomeAwayStatKeys,
): Promise<{
  validation: TxlineStatValidation;
  statKey: number;
  seq: number;
  verifyReason: string;
} | null> {
  const seqCandidates = await listSeqCandidates(String(fid), preferredSeq);
  let fallback: {
    validation: TxlineStatValidation;
    statKey: number;
    seq: number;
    verifyReason: string;
  } | null = null;

  for (const seq of seqCandidates) {
    const dual = await fetchStatValidation(
      fid,
      seq,
      statKeys.homeStatKey,
      statKeys.awayStatKey,
    );
    if (dual?.statToProve) {
      const verify = runMerkleVerify(dual);
      const candidate = {
        validation: dual,
        statKey: statKeys.homeStatKey,
        seq,
        verifyReason: verify.reason,
      };
      if (target && validationMatchesScore(dual, target, statKeys)) {
        return candidate;
      }
      if (!fallback) fallback = candidate;
    }

    for (const statKey of [statKeys.homeStatKey, statKeys.awayStatKey]) {
      const single = await fetchStatValidation(fid, seq, statKey);
      if (!single?.statToProve) continue;
      const verify = runMerkleVerify(single);
      const candidate = {
        validation: single,
        statKey,
        seq,
        verifyReason: verify.reason,
      };
      if (target && validationMatchesScore(single, target, statKeys)) {
        return candidate;
      }
      if (!fallback) fallback = candidate;
    }
  }

  return fallback;
}

export async function getFixtureProof(fixtureId: string): Promise<SettlementProof> {
  if (process.env.TXODDS_MOCK === "true") {
    return mockProof(fixtureId);
  }
  if (!process.env.TXLINE_API_TOKEN?.trim()) {
    return mockProof(fixtureId);
  }

  try {
    const fid = Number.parseInt(fixtureId, 10);
    if (!Number.isFinite(fid)) {
      throw new Error("invalid_fixture_id");
    }

    const seq = await resolveSeq(fixtureId);
    if (seq === null) {
      throw new Error("proof_pending_no_snapshot");
    }

    const prevSeq = seqCache.get(fixtureId);
    const effectiveSeq = prevSeq !== undefined && prevSeq > seq ? prevSeq : seq;
    if (effectiveSeq !== seq) {
      seqCache.set(fixtureId, effectiveSeq);
    } else {
      seqCache.set(fixtureId, seq);
    }

    const scores = await getFixtureScores(fixtureId);
    const target = scores?.score;
    const statKeys = txlineHomeAwayStatKeys(scores?.participant1IsHome ?? readParticipant1IsHome(fixtureId));

    const resolved = await resolveStatValidation(
      fid,
      effectiveSeq,
      target ?? undefined,
      statKeys,
    );
    if (!resolved) {
      const cached = proofCache.get(fixtureId);
      if (cached?.validated) {
        return cached;
      }
      throw new Error("proof_pending_first_score");
    }

    const { validation, statKey, seq: resolvedSeq, verifyReason } = resolved;
    const proof = mapValidationToProof(
      fixtureId,
      validation,
      resolvedSeq,
      statKey,
      verifyReason,
    );
    const adjusted =
      scores && shouldTreatAsPrematchPending(scores, proof)
        ? { ...proof, validated: false, verifyReason: "proof_pending_prematch" }
        : proof;
    proofCache.set(fixtureId, adjusted);
    return adjusted;
  } catch (err) {
    const message = err instanceof Error ? err.message : "proof_failed";
    const cached = proofCache.get(fixtureId);
    if (cached?.validated && isProofPendingMessage(message)) {
      return cached;
    }
    throw err;
  }
}

export async function verifyFixtureProof(fixtureId: string): Promise<{
  valid: boolean;
  reason: string;
  proof?: SettlementProof;
}> {
  if (process.env.TXODDS_MOCK === "true" || !process.env.TXLINE_API_TOKEN?.trim()) {
    return { valid: false, reason: "mock_or_no_token" };
  }

  try {
    const proof = await getFixtureProof(fixtureId);
    return {
      valid: proof.validated,
      reason: proof.verifyReason ?? (proof.validated ? "ok" : "verify_failed"),
      proof,
    };
  } catch (err) {
    return {
      valid: false,
      reason: err instanceof Error ? err.message : "verify_error",
    };
  }
}

export { mockProof, runMerkleVerify };

function escrowEnabled(): boolean {
  return process.env.NATT_ESCROW_ENABLED === "true";
}

async function resolveEffectiveSeq(fixtureId: string): Promise<number> {
  const seq = await resolveSeq(fixtureId);
  if (seq === null) {
    throw new Error("proof_pending_no_snapshot");
  }
  const prevSeq = seqCache.get(fixtureId);
  const effectiveSeq = prevSeq !== undefined && prevSeq > seq ? prevSeq : seq;
  seqCache.set(fixtureId, effectiveSeq);
  return effectiveSeq;
}

export type FetchTwoStatOptions = {
  target: CpiScoreTarget;
  outcome: EscrowOutcome;
  statKeys: TxlineHomeAwayStatKeys;
  /** Match regulation score exactly even when outcome predicate differs (knockout TAB tie CPI). */
  targetExactOnly?: boolean;
  /** Accept any tied regulation score in the Merkle tree (knockout TAB fallback). */
  acceptRegulationTie?: boolean;
};

function validationMatchesTarget(
  validation: TxlineStatValidation,
  target: CpiScoreTarget,
  outcome: EscrowOutcome,
  statKeys: TxlineHomeAwayStatKeys,
  options: Pick<FetchTwoStatOptions, "targetExactOnly" | "acceptRegulationTie">,
): boolean {
  const home = validation.statToProve?.value;
  const away = validation.statToProve2?.value;
  if (home === undefined || away === undefined) return false;
  if (validation.statToProve?.key !== statKeys.homeStatKey) return false;
  if (validation.statToProve2?.key !== statKeys.awayStatKey) return false;

  if (options.acceptRegulationTie && options.targetExactOnly && outcome === "draw") {
    return validationIsRegulationTie(home, away);
  }
  if (options.targetExactOnly) {
    return validationMatchesCpiTarget(home, away, target);
  }
  if (!validationMatchesCpiTarget(home, away, target)) return false;
  return statsImplyOutcome(home, away, outcome);
}

async function fetchTwoStatValidationFromCluster(
  fixtureId: string,
  cluster: EscrowCluster,
  options: FetchTwoStatOptions,
  preferredSeq?: number,
): Promise<TxlineStatValidation> {
  const fid = Number.parseInt(fixtureId, 10);
  if (!Number.isFinite(fid)) {
    throw new Error("invalid_fixture_id");
  }

  const { target, outcome, statKeys, targetExactOnly = false, acceptRegulationTie = false } = options;
  const effectiveSeq = preferredSeq ?? (await resolveEffectiveSeq(fixtureId));
  const seqCandidates = (await listSeqCandidates(fixtureId, effectiveSeq)).slice(0, CPI_SEQ_SCAN_CAP);

  let outcomeOnlyFallback: TxlineStatValidation | null = null;
  let tieFallback: TxlineStatValidation | null = null;
  const seen: string[] = [];

  for (const seq of seqCandidates) {
    const query = new URLSearchParams({
      fixtureId: String(fid),
      seq: String(seq),
      statKey: String(statKeys.homeStatKey),
      statKey2: String(statKeys.awayStatKey),
    });
    const validation = await escrowTxlineGet<TxlineStatValidation>(
      `/api/scores/stat-validation?${query.toString()}`,
      cluster,
    );

    if (!validation?.statToProve || !validation.statToProve2) continue;
    if (!validation.summary?.updateStats || !validation.summary.eventStatsSubTreeRoot) {
      continue;
    }

    const home = validation.statToProve.value;
    const away = validation.statToProve2.value;
    const period = validation.statToProve.period;
    if (home !== undefined && away !== undefined) {
      seen.push(`seq${seq}:${home}-${away}@p${period}`);
    }

    if (validationMatchesTarget(validation, target, outcome, statKeys, { targetExactOnly, acceptRegulationTie })) {
      return validation;
    }

    if (
      acceptRegulationTie &&
      outcome === "draw" &&
      home !== undefined &&
      away !== undefined &&
      validationIsRegulationTie(home, away) &&
      !tieFallback
    ) {
      tieFallback = validation;
    }

    if (
      home !== undefined &&
      away !== undefined &&
      statsImplyOutcome(home, away, outcome) &&
      !outcomeOnlyFallback
    ) {
      outcomeOnlyFallback = validation;
    }
  }

  if (tieFallback) {
    return tieFallback;
  }

  if (outcomeOnlyFallback) {
    return outcomeOnlyFallback;
  }

  const sample = seen.slice(0, 8).join("; ");
  throw new Error(
    `cpi_validation_no_matching_seq: target ${target.home}-${target.away} mode=${target.mode} outcome=${outcome}` +
      (sample ? ` seen=[${sample}]` : ""),
  );
}

/** Pen shootout totals via soccer feed keys 5001/5002 (PE period). */
export async function discoverPenStatValidation(
  fixtureId: string,
  penScore: { home: number; away: number },
  outcome: EscrowOutcome,
  statKeys: TxlineHomeAwayStatKeys,
): Promise<TxlineStatValidation | null> {
  const effectiveSeq = await resolveEffectiveSeq(fixtureId);
  const seqCandidates = (await listSeqCandidates(fixtureId, effectiveSeq)).slice(0, CPI_SEQ_SCAN_CAP);
  const cluster = escrowCluster();
  const fid = Number.parseInt(fixtureId, 10);
  if (!Number.isFinite(fid)) return null;

  const tryCluster = async (c: EscrowCluster): Promise<TxlineStatValidation | null> => {
    for (const seq of seqCandidates) {
      const query = new URLSearchParams({
        fixtureId: String(fid),
        seq: String(seq),
        statKey: String(statKeys.homeStatKey),
        statKey2: String(statKeys.awayStatKey),
      });
      let validation: TxlineStatValidation | null = null;
      try {
        validation = await escrowTxlineGet<TxlineStatValidation>(
          `/api/scores/stat-validation?${query.toString()}`,
          c,
        );
      } catch {
        continue;
      }
      if (!validation?.statToProve || !validation.statToProve2) continue;
      if (validation.statToProve.key !== statKeys.homeStatKey) continue;
      if (validation.statToProve2.key !== statKeys.awayStatKey) continue;
      const home = validation.statToProve.value;
      const away = validation.statToProve2.value;
      if (home !== penScore.home || away !== penScore.away) continue;
      if (!statsImplyOutcome(home, away, outcome)) continue;
      if (!validation.summary?.updateStats || !validation.summary.eventStatsSubTreeRoot) continue;
      return validation;
    }
    return null;
  };

  try {
    const hit = await tryCluster(cluster);
    if (hit) return hit;
  } catch {
    /* fall through */
  }
  if (cluster === "devnet") {
    return tryCluster("mainnet");
  }
  return null;
}

export async function fetchTwoStatValidation(
  fixtureId: string,
  options: FetchTwoStatOptions,
): Promise<TxlineStatValidation> {
  if (process.env.TXODDS_MOCK === "true") {
    throw new Error("escrow_requires_live_txline");
  }
  const cluster = escrowCluster();
  const hasToken =
    cluster === "devnet"
      ? Boolean(process.env.TXLINE_DEV_API_TOKEN?.trim() || process.env.TXLINE_API_TOKEN?.trim())
      : Boolean(process.env.TXLINE_API_TOKEN?.trim());
  if (!hasToken) {
    throw new Error("escrow_requires_txline_token");
  }

  try {
    return await fetchTwoStatValidationFromCluster(fixtureId, cluster, options);
  } catch (err) {
    // Hackathon fallback: devnet TxLINE subscription often missing — reuse mainnet proof bytes.
    if (cluster === "devnet") {
      return fetchTwoStatValidationFromCluster(fixtureId, "mainnet", options);
    }
    throw err;
  }
}

export function isEscrowEnabled(): boolean {
  return escrowEnabled();
}
