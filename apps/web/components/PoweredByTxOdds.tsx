"use client";

import Link from "next/link";
import { TxOddsLogo } from "@/components/TxOddsLogo";
import { usePresent } from "@/components/present/PresentProvider";
import { shell } from "@/lib/appShellI18n";
import { TXODDS_PARTNER_URL } from "@/lib/brandLinks";

export { SUPER_TEAM_HACKATHON_URL, TXODDS_PARTNER_URL } from "@/lib/brandLinks";

export function PoweredByTxOdds() {
  const { lang } = usePresent();
  const s = shell(lang);

  return (
    <footer className="powered-by-txodds" aria-label={`${s.poweredByLabel} TxODDS`}>
      <Link
        href={TXODDS_PARTNER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="powered-by-txodds-link"
      >
        <span className="powered-by-label">{s.poweredByLabel}</span>
        <span className="powered-by-brand-row">
          <TxOddsLogo height={28} className="powered-by-logo" />
          <span className="txodds-wordmark">TxODDS</span>
        </span>
      </Link>
    </footer>
  );
}
