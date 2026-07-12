import { BRAND_ASSETS } from "@/lib/uiAssets";

type Props = { height?: number; className?: string };

/** TxODDS partner mark (hackathon/Visuels/so8tn7cfinudbwpvlykv.webp) */
export function TxOddsLogo({ height = 36, className = "" }: Props) {
  return (
    <img
      src={BRAND_ASSETS.txoddsLogo}
      alt="TxODDS"
      height={height}
      width={Math.round(height * 1.05)}
      className={`txodds-logo ${className}`.trim()}
      decoding="async"
    />
  );
}

/** Hackathon / concours logo (hackathon/Visuels/altLogo.avif) */
export function ContestLogo({ height = 44, className = "" }: Props) {
  const width = Math.round(height * 2.8);
  return (
    <img
      src={BRAND_ASSETS.contestLogo}
      alt="TxODDS World Cup hackathon"
      height={height}
      width={width}
      className={`contest-logo ${className}`.trim()}
      decoding="async"
    />
  );
}
