import { PoweredByTxOdds } from "@/components/PoweredByTxOdds";

/** Powered by TxODDS — fin de scroll de chaque onglet, au-dessus du tab bar. */
export function StitchPanelFooter() {
  return (
    <footer className="stitch-panel-footer" aria-label="Powered by TxODDS">
      <PoweredByTxOdds />
    </footer>
  );
}
