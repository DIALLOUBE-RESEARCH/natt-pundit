type Props = {
  modelPct: number;
  marketPct: number;
  modelLabel?: string;
  marketLabel?: string;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** Relative model vs Shin market probability split — mobile-first bar. */
export function StitchModelMarketBar({
  modelPct,
  marketPct,
  modelLabel = "Model",
  marketLabel = "Market",
}: Props) {
  const model = clampPct(modelPct);
  const market = clampPct(marketPct);
  const total = model + market;
  const modelShare = total > 0 ? (model / total) * 100 : 50;
  const marketShare = total > 0 ? (market / total) * 100 : 50;

  return (
    <div className="stitch-model-market-bar" role="img" aria-label={`${modelLabel} ${model.toFixed(0)}%, ${marketLabel} ${market.toFixed(0)}%`}>
      <div className="stitch-model-market-bar__track">
        <div className="stitch-model-market-bar__fill stitch-model-market-bar__fill--model" style={{ width: `${modelShare}%` }} />
        <div className="stitch-model-market-bar__fill stitch-model-market-bar__fill--market" style={{ width: `${marketShare}%` }} />
      </div>
      <div className="stitch-model-market-bar__labels">
        <span className="stitch-model-market-bar__label stitch-model-market-bar__label--model">
          <span className="stitch-model-market-bar__key">{modelLabel}</span>
          <span className="stitch-model-market-bar__pct">{model.toFixed(0)}%</span>
        </span>
        <span className="stitch-model-market-bar__label stitch-model-market-bar__label--market">
          <span className="stitch-model-market-bar__key">{marketLabel}</span>
          <span className="stitch-model-market-bar__pct">{market.toFixed(0)}%</span>
        </span>
      </div>
    </div>
  );
}
