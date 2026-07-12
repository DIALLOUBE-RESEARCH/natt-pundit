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
  publicEdgeSummaryText,
} from "@/lib/edgePublicI18n";
import { ui } from "@/lib/i18n";
import { outcomeLabel } from "@/lib/outcomeDiagnostic";
import type { AppLang } from "@/lib/locales";

type Props = {
  verdict: EdgeDisplayVerdict;
  homeTeam: string;
  awayTeam: string;
  consensus?: ConsensusProbs;
  wcFormat?: WcMatchFormat;
  lang?: AppLang;
};

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="stitch-stat-row">
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

  if (!isPublicEdgeVerdict(verdict)) {
    return (
      <div className="stitch-edge-panel">
        <LiquidGlassPill as="div" variant={setup ? "setup" : "hold"}>
          <span className="stitch-lg-pill-val">{setup ? t.verdictSetup : t.verdictHold}</span>
        </LiquidGlassPill>
      </div>
    );
  }

  const summary = publicEdgeSummaryText(verdict, homeTeam, awayTeam, lang);

  const labels = edgePublicLabels(lang);
  const sideName =
    verdict.direction && verdict.direction !== "none"
      ? outcomeLabel(verdict.direction, homeTeam, awayTeam, lang)
      : "—";
  const conviction = convictionTierLabel(verdict.conviction, lang);
  const signal =
    verdict.verdict === "SETUP" && verdict.direction && verdict.direction !== "none"
      ? labels.setupSummary(sideName, conviction)
      : labels.holdSummary;
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

      <dl className="stitch-stat-grid">
        {verdict.verdict === "SETUP" && verdict.direction && verdict.direction !== "none" ? (
          <StatRow label={labels.edgeSide} value={sideName} highlight />
        ) : null}
        <StatRow label={labels.edgeConviction} value={conviction} />
        {consensus ? (
          <StatRow
            label={labels.edgeShinMarket}
            value={formatShinConsensusLine(consensus, homeTeam, awayTeam, wcFormat, lang)}
          />
        ) : null}
        <StatRow label={labels.edgeModelSignal} value={signal} />
      </dl>
    </div>
  );
}
