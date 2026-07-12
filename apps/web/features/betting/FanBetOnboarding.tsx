"use client";

import { fanBetCopy } from "@/lib/fanBetI18n";
import { usePresent } from "@/components/present/PresentProvider";

const SOL_FAUCET = "https://faucet.solana.com/";
const USDC_FAUCET = "https://faucet.circle.com/";

export function FanBetOnboarding() {
  const { lang } = usePresent();
  const c = fanBetCopy(lang);

  return (
    <div className="stitch-present-callout stitch-fan-bet-demo">
      <p className="stitch-present-callout-title">{c.demoTitle}</p>
      <p className="stitch-present-callout-body">{c.demoBody}</p>
      <p className="stitch-fan-bet-faucets">
        <a href={SOL_FAUCET} target="_blank" rel="noopener noreferrer">
          {c.faucetSol}
        </a>
        <span aria-hidden> · </span>
        <a href={USDC_FAUCET} target="_blank" rel="noopener noreferrer">
          {c.faucetUsdc}
        </a>
      </p>
    </div>
  );
}
