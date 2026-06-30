/** Logit combine: logit(c) = alpha*log(pi_tx) + beta*log(pi_model). */

const EPS = 1e-9;

export function clampProb(p: number): number {
  return Math.min(Math.max(p, EPS), 1 - EPS);
}

export function logit(p: number): number {
  const x = clampProb(p);
  return Math.log(x / (1 - x));
}

export function invLogit(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export type CombineInput = {
  piTx: number;
  piModel: number;
  alpha?: number;
  beta?: number;
};

export function combineProbs(input: CombineInput): number {
  const alpha = input.alpha ?? 1;
  const beta = input.beta ?? 1;
  const combined = alpha * logit(input.piTx) + beta * logit(input.piModel);
  return invLogit(combined);
}

export function edgeOverConsensus(c: number, piTx: number): number {
  return c - piTx;
}
