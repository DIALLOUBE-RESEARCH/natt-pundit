/** Pure keeper helpers (no I/O — unit tested). */

function fundedOutcomeCount(sideTotals) {
  return sideTotals.filter((s) => BigInt(s) > 0n).length;
}

export function resolveOutcomeFromScores(fixture, scores) {
  const score = scores?.score ?? fixture?.score;
  if (!score || typeof score.home !== "number" || typeof score.away !== "number") {
    return null;
  }
  const kickoff = fixture?.kickoffAt ?? scores?.kickoffAt ?? "";
  const knockout = String(kickoff).includes("knockout") || fixture?.wcFormat === "knockout";
  if (knockout) {
    if (score.home !== score.away) {
      return score.home > score.away ? "home" : "away";
    }
    const pen = scores?.penScore;
    if (!pen) return null;
    if (pen.home === pen.away) return null;
    return pen.home > pen.away ? "home" : "away";
  }
  if (score.home > score.away) return "home";
  if (score.away > score.home) return "away";
  return "draw";
}

export function shouldAttemptSettle({ fixtureStatus, pool, sideTotals }) {
  if (fixtureStatus !== "finished") return false;
  if (!pool?.exists || pool.settled) return false;
  if (fundedOutcomeCount(sideTotals) < 2) return false;
  return true;
}
