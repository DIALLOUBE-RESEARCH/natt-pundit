import type { SettlementProof } from "@natt-pundit/contracts";
import { useEffect, useState } from "react";
import { fetchSettlementProof } from "@/lib/api";

type Props = { fixtureId: string };

function explorerLink(proof: SettlementProof): string | null {
  if (proof.explorerUrl) return proof.explorerUrl;
  if (!proof.txSig) return null;
  return `https://explorer.solana.com/tx/${proof.txSig}`;
}

export function SettlementProofPanel({ fixtureId }: Props) {
  const [proof, setProof] = useState<SettlementProof | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!fixtureId) return;
    fetchSettlementProof(fixtureId)
      .then(setProof)
      .catch(() => setErr("Preuve settlement indisponible"));
  }, [fixtureId]);

  if (err) return <p className="match-error">{err}</p>;
  if (!proof) return <p className="match-loading">Chargement preuve Merkle…</p>;

  const explorer = explorerLink(proof);
  const sourceLabel = proof.source === "txline" ? "TxLINE (live)" : "mock (dev)";

  return (
    <section className="proof-panel glass-panel">
      <h2 className="section-title">Settlement (TxLINE / Solana)</h2>
      <p className="proof-source">
        Source: <strong>{sourceLabel}</strong>
        {proof.seq !== undefined ? ` · seq ${proof.seq}` : null}
      </p>
      <dl className="proof-dl">
        <div>
          <dt>Stat</dt>
          <dd>
            {proof.statType}: {proof.statValue}
          </dd>
        </div>
        <div>
          <dt>Valide on-chain</dt>
          <dd>
            {proof.validated ? (
              <span className="proof-valid-badge">Merkle verifie (local)</span>
            ) : proof.source === "txline" ? (
              "en attente verification"
            ) : (
              "en attente (mock)"
            )}
          </dd>
        </div>
        {explorer ? (
          <div>
            <dt>Explorer</dt>
            <dd>
              <a href={explorer} target="_blank" rel="noreferrer" className="proof-link">
                Voir transaction Solana
              </a>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Merkle root</dt>
          <dd className="mono">{proof.merkleRoot}</dd>
        </div>
        <div>
          <dt>Leaf</dt>
          <dd className="mono">{proof.leafHash}</dd>
        </div>
        <div>
          <dt>Proof path</dt>
          <dd className="mono">{proof.proof.join(" → ")}</dd>
        </div>
      </dl>
    </section>
  );
}
