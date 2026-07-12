import type { ConsensusProbs, WcMatchFormat } from "@natt-pundit/contracts";
import type { EdgeDisplayVerdict } from "@/lib/edgeDisplay";
import { displayConviction, isPublicEdgeVerdict } from "@/lib/edgeDisplay";
import {
  convictionTierLabel,
  edgePublicLabels,
  formatShinConsensusLine,
} from "@/lib/edgePublicI18n";
import { outcomeLabel } from "@/lib/outcomeDiagnostic";
import { usePresent } from "@/components/present/PresentProvider";
import { shell } from "@/lib/appShellI18n";
import type { AppLang } from "@/lib/locales";

type Props = { verdict: EdgeDisplayVerdict };

export function EdgeBadge({ verdict }: Props) {
  const setup = verdict.verdict === "SETUP";
  const conviction = displayConviction(verdict);
  const { lang } = usePresent();
  return (
    <div className={`edge-badge ${setup ? "edge-setup" : "edge-hold"}`}>
      <span className="edge-icon">{setup ? "◆" : "‖"}</span>
      <span className="edge-verdict">{verdict.verdict}</span>
      {conviction && conviction !== "none" ? (
        <span className="edge-score">{convictionTierLabel(conviction, lang)}</span>
      ) : null}
    </div>
  );
}

type DetailProps = {
  verdict: EdgeDisplayVerdict;
  homeTeam?: string;
  awayTeam?: string;
  consensus?: ConsensusProbs;
  wcFormat?: WcMatchFormat;
  lang?: AppLang;
};

export function EdgeDetail({
  verdict,
  homeTeam,
  awayTeam,
  consensus,
  wcFormat = "group",
  lang: langProp,
}: DetailProps) {
  const { lang: presentLang } = usePresent();
  const lang = langProp ?? presentLang;
  const s = shell(lang);

  if (isPublicEdgeVerdict(verdict) && homeTeam && awayTeam) {
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

    return (
      <div className="edge-public-panel">
        <dl className="edge-dl edge-dl--public">
          {verdict.verdict === "SETUP" && verdict.direction && verdict.direction !== "none" ? (
            <div className="edge-dl-row">
              <dt>{labels.edgeSide}</dt>
              <dd className="edge-direction">{sideName}</dd>
            </div>
          ) : null}
          <div className="edge-dl-row">
            <dt>{labels.edgeConviction}</dt>
            <dd>{conviction}</dd>
          </div>
          {consensus ? (
            <div className="edge-dl-row">
              <dt>{labels.edgeShinMarket}</dt>
              <dd>{formatShinConsensusLine(consensus, homeTeam, awayTeam, wcFormat, lang)}</dd>
            </div>
          ) : null}
          <div className="edge-dl-row edge-dl-row--signal">
            <dt>{labels.edgeModelSignal}</dt>
            <dd>{signal}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (isPublicEdgeVerdict(verdict)) {
    const labels = edgePublicLabels(lang);
    return (
      <dl className="edge-dl edge-dl--public">
        {verdict.verdict === "SETUP" && verdict.direction && verdict.direction !== "none" ? (
          <div className="edge-dl-row">
            <dt>{labels.edgeSide}</dt>
            <dd className="edge-direction">{verdict.direction.toUpperCase()}</dd>
          </div>
        ) : null}
        <div className="edge-dl-row">
          <dt>{labels.edgeConviction}</dt>
          <dd>{convictionTierLabel(verdict.conviction, lang)}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="edge-dl">
      {verdict.verdict === "SETUP" && verdict.direction !== "none" ? (
        <div className="edge-dl-row">
          <dt>{s.edgeDirection.toLowerCase()}</dt>
          <dd>{verdict.direction}</dd>
        </div>
      ) : null}
      <div className="edge-dl-row">
        <dt>pi_tx (Shin)</dt>
        <dd>{verdict.pi_tx.toFixed(4)}</dd>
      </div>
      <div className="edge-dl-row">
        <dt>pi_model</dt>
        <dd>{verdict.pi_model.toFixed(4)}</dd>
      </div>
      <div className="edge-dl-row">
        <dt>c (combine)</dt>
        <dd>{verdict.c.toFixed(4)}</dd>
      </div>
      <div className="edge-dl-row">
        <dt>epsilon_net</dt>
        <dd>{verdict.epsilon_net.toFixed(3)}</dd>
      </div>
      <div className="edge-dl-row">
        <dt>c - pi_tx</dt>
        <dd>{verdict.edge_score.toFixed(4)}</dd>
      </div>
      {verdict.direction && verdict.direction !== "none" ? (
        <div className="edge-dl-row">
          <dt>{s.edgeDirection}</dt>
          <dd className="edge-direction">{verdict.direction.toUpperCase()}</dd>
        </div>
      ) : null}
    </dl>
  );
}
