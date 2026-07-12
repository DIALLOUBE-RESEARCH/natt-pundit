/**
 * Shin de-vig — remove bookmaker margin from implied probabilities.
 * Pure function; iterative z for multi-outcome markets.
 */

const EPS = 1e-12;

function clampProb(p: number): number {
  return Math.min(Math.max(p, EPS), 1 - EPS);
}

/** Single-outcome Shin z given raw implied probs that sum > 1. */
export function shinZ(implied: number[]): number {
  const n = implied.length;
  if (n === 0) return 0;

  const sum = implied.reduce((a, b) => a + b, 0);
  if (sum <= 1 + EPS) return 0;

  let z = 0;
  for (let iter = 0; iter < 80; iter++) {
    let f = 0;
    let fp = 0;
    for (const p of implied) {
      const denom = 1 - z * (1 - p);
      if (denom <= EPS) continue;
      const term = Math.sqrt(p) / denom;
      f += term;
      fp += (term * (1 - p)) / denom;
    }
    const g = f - 1;
    if (Math.abs(g) < 1e-9) break;
    z -= g / (fp || 1);
    z = Math.max(0, Math.min(z, 0.99));
  }
  return z;
}

/** Shin-adjusted fair probabilities (sum to 1). */
export function shinDevig(implied: number[]): number[] {
  if (implied.length === 0) return [];
  const raw = implied.map((p) => clampProb(p));
  const sum = raw.reduce((a, b) => a + b, 0);
  if (sum <= 1 + EPS) {
    const norm = sum > 0 ? sum : 1;
    return raw.map((p) => p / norm);
  }

  const z = shinZ(raw);
  const fair = raw.map((p) => {
    const denom = 1 - z * (1 - p);
    const term = Math.sqrt(p) / denom;
    return term * term;
  });
  const fairSum = fair.reduce((a, b) => a + b, 0);
  return fair.map((p) => p / (fairSum || 1));
}
