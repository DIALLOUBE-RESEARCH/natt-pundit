import type { EdgeVerdict } from "@natt-pundit/contracts";

type Props = { verdict: EdgeVerdict };

export function EdgeBadge({ verdict }: Props) {
  const setup = verdict.verdict === "SETUP";
  return (
    <div className={`edge-badge ${setup ? "edge-setup" : "edge-hold"}`}>
      <span className="edge-icon">{setup ? "◆" : "‖"}</span>
      <span className="edge-verdict">{verdict.verdict}</span>
      <span className="edge-score">{verdict.edge_score.toFixed(3)}</span>
    </div>
  );
}

export function EdgeDetail({ verdict }: Props) {
  return (
    <dl className="edge-dl">
      <div>
        <dt>pi_tx (Shin)</dt>
        <dd>{verdict.pi_tx.toFixed(4)}</dd>
      </div>
      <div>
        <dt>pi_model</dt>
        <dd>{verdict.pi_model.toFixed(4)}</dd>
      </div>
      <div>
        <dt>c (combine)</dt>
        <dd>{verdict.c.toFixed(4)}</dd>
      </div>
      <div>
        <dt>epsilon_net</dt>
        <dd>{verdict.epsilon_net.toFixed(3)}</dd>
      </div>
      <div>
        <dt>c - pi_tx</dt>
        <dd>{verdict.edge_score.toFixed(4)}</dd>
      </div>
    </dl>
  );
}
