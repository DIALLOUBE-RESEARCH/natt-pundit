/**
 * F96N P1 — poll finished fixtures and submit permissionless settle txs.
 */
import axios from "axios";
import { broadcastSettleTx, fetchEscrowPool } from "../mcp/escrow-agent.mjs";
import { resolveOutcomeFromScores, shouldAttemptSettle } from "./loopCore.mjs";

export { resolveOutcomeFromScores, shouldAttemptSettle } from "./loopCore.mjs";

/**
 * @param {object} opts
 * @param {string} opts.gateway
 * @param {import('@solana/web3.js').Keypair} opts.signerKeypair
 * @param {(msg: string, extra?: object) => void} [opts.log]
 */
export async function runKeeperTick({ gateway, signerKeypair, log = () => {} }) {
  const results = { scanned: 0, attempted: 0, settled: 0, skipped: 0, errors: [] };

  let fixtures;
  try {
    const { data } = await axios.get(`${gateway}/v1/fixtures`, { timeout: 30_000 });
    fixtures = data?.fixtures ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : "fixtures_fetch_failed";
    results.errors.push({ stage: "fixtures", message });
    return results;
  }

  const finished = fixtures.filter((f) => f.status === "finished");
  results.scanned = finished.length;

  for (const fixture of finished) {
    const fixtureId = String(fixture.fixtureId);
    let poolResp;
    try {
      poolResp = await fetchEscrowPool(fixtureId);
    } catch (err) {
      results.errors.push({
        fixtureId,
        stage: "pool",
        message: err instanceof Error ? err.message : "pool_fetch_failed",
      });
      continue;
    }

    const pool = poolResp.pool;
    const sideTotals = (pool.sideTotals ?? []).map((s) => String(s));
    if (!shouldAttemptSettle({ fixtureStatus: fixture.status, pool, sideTotals })) {
      results.skipped += 1;
      continue;
    }

    let scores;
    try {
      const { data } = await axios.get(`${gateway}/v1/fixtures/${fixtureId}/scores`, {
        timeout: 20_000,
      });
      scores = data;
    } catch (err) {
      results.errors.push({
        fixtureId,
        stage: "scores",
        message: err instanceof Error ? err.message : "scores_failed",
      });
      continue;
    }

    const outcome = resolveOutcomeFromScores(fixture, scores);
    if (!outcome) {
      results.skipped += 1;
      continue;
    }

    results.attempted += 1;
    try {
      const tx = await broadcastSettleTx({
        fixture_id: fixtureId,
        outcome,
        signerKeypair,
      });
      results.settled += 1;
      log("settle_ok", { fixtureId, outcome, sig: tx.tx_signature });
    } catch (err) {
      const message = err instanceof Error ? err.message : "settle_failed";
      if (message.includes("already") || message.includes("settled")) {
        results.skipped += 1;
        continue;
      }
      results.errors.push({ fixtureId, stage: "settle", message });
      log("settle_error", { fixtureId, outcome, message });
    }
  }

  return results;
}
