"use client";

import type { ConsensusProbs, WcMatchFormat } from "@natt-pundit/contracts";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { usePresent } from "@/components/present/PresentProvider";
import type { EdgeDisplayVerdict } from "@/lib/edgeDisplay";
import { displayConviction, isPublicEdgeVerdict } from "@/lib/edgeDisplay";
import {
  convictionTierLabel,
  edgePublicLabels,
  formatShinConsensusLine,
  publicEdgeSignalRowShort,
  publicEdgeSummaryText,
} from "@/lib/edgePublicI18n";
import { ui } from "@/lib/i18n";
import { outcomeLabel } from "@/lib/outcomeDiagnostic";
import type { AppLang } from "@/lib/locales";
import { StitchModelMarketBar } from "@/features/match/stitch/StitchModelMarketBar";

type Props = {
  verdict: EdgeDisplayVerdict;
  homeTeam: string;
  awayTeam: string;
  consensus?: ConsensusProbs;
  wcFormat?: WcMatchFormat;
  lang?: AppLang;
};

function StatRow({
  label,
  value,
  highlight,
  stacked,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  stacked?: boolean;
}) {
  return (
    <div className={`stitch-stat-row${stacked ? " stitch-stat-row--stack" : ""}`}>
      <dt>{label}</dt>
      <dd className={highlight ? "stitch-stat-row__value--accent" : undefined}>{value}</dd>
    </div>
  );
}

/** iOS-grade edge breakdown — LiquidGlass pill + glass stat rows (F92N match detail). */
export function StitchEdgePanel({
  verdict,
  homeTeam,
  awayTeam,
  consensus,
  wcFormat = "group",
  lang: langProp,
}: Props) {
  const { lang: presentLang } = usePresent();
  const lang = langProp ?? presentLang;
  const t = ui(lang);
  const setup = verdict.verdict === "SETUP";
  const labels = edgePublicLabels(lang);

  if (!isPublicEdgeVerdict(verdict)) {
    return (
      <div className="stitch-edge-panel">
        <LiquidGlassPill as="div" variant={setup ? "setup" : "hold"}>
          <span className="stitch-lg-pill-val">{setup ? t.verdictSetup : t.verdictHold}</span>
        </LiquidGlassPill>
        <div className="stitch-edge-signal-block">
          <p className="stitch-edge-signal-title">{labels.edgeModelSignal}</p>
          <StitchModelMarketBar
            modelPct={verdict.pi_model * 100}
            marketPct={verdict.pi_tx * 100}
            modelLabel={labels.modelBarModel}
            marketLabel={labels.modelBarMarket}
          />
        </div>
      </div>
    );
  }

  const summary = publicEdgeSummaryText(verdict, homeTeam, awayTeam, lang);
  const signalShort = publicEdgeSignalRowShort(verdict, homeTeam, awayTeam, lang);

  const sideName =
    verdict.direction && verdict.direction !== "none"
      ? outcomeLabel(verdict.direction, homeTeam, awayTeam, lang)
      : "—";
  const conviction = convictionTierLabel(verdict.conviction, lang);
  const convictionDisplay = displayConviction(verdict);
  const convictionExtra =
    convictionDisplay && convictionDisplay !== "none" ? convictionTierLabel(convictionDisplay, lang) : null;

  return (
    <div className="stitch-edge-panel">
      <LiquidGlassPill as="div" variant={setup ? "setup" : "hold"}>
        <span className="stitch-lg-pill-val">{setup ? t.verdictSetup : t.verdictHold}</span>
        {convictionExtra ? <span className="stitch-edge-pill-tier">{convictionExtra}</span> : null}
      </LiquidGlassPill>

      <p className="stitch-match-edge-why">{summary}</p>

      <div className="stitch-edge-signal-block">
        <p className="stitch-edge-signal-title">{labels.edgeModelSignal}</p>
        <p className="stitch-edge-signal-short">{signalShort}</p>
      </div>

      <dl className="stitch-stat-grid">
        {verdict.verdict === "SETUP" && verdict.direction && verdict.direction !== "none" ? (
          <StatRow label={labels.edgeSide} value={sideName} highlight />
        ) : null}
        <StatRow label={labels.edgeConviction} value={conviction} />
        {consensus ? (
          <StatRow
            label={labels.edgeShinMarket}
            value={formatShinConsensusLine(consensus, homeTeam, awayTeam, wcFormat, lang)}
            stacked
          />
        ) : null}
      </dl>
    </div>
  );
}
