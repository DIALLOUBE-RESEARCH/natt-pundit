import { useMemo, useState } from "react";
import { teamCircleFlagUrl, teamFlagIso, teamFlagUrl } from "@/lib/countryFlags";
import { initials } from "@/lib/teamColors";

type Props = {
  team: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "circle" | "rect";
  muted?: boolean;
};

const SIZES = { xs: 32, sm: 40, md: 48, lg: 56, xl: 64 };

function cdnWidth(size: "xs" | "sm" | "md" | "lg" | "xl"): number {
  if (size === "xs" || size === "sm") return 80;
  if (size === "xl" || size === "lg") return 320;
  return 160;
}

export function TeamFlag({
  team,
  size = "md",
  variant = "rect",
  muted = false,
}: Props) {
  const px = SIZES[size];
  const circle = variant === "circle";

  const sources = useMemo(() => {
    if (circle) {
      const svg = teamCircleFlagUrl(team);
      const cdn = teamFlagUrl(team, 160);
      return [svg, cdn].filter((u): u is string => Boolean(u));
    }
    const cdn = teamFlagUrl(team, cdnWidth(size));
    return cdn ? [cdn] : [];
  }, [team, size, circle]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const url = sources[sourceIndex] ?? null;

  const wrapClass = [
    "team-flag-wrap",
    `team-flag-wrap--${size}`,
    circle ? "team-flag-wrap--circle" : "team-flag-wrap--rect",
    muted ? "team-flag-wrap--muted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const boxStyle = circle
    ? ({ width: px, height: px } as const)
    : ({ width: px, height: Math.round(px * 0.68) } as const);

  const bumpFallback = () => {
    setSourceIndex((i) => (i + 1 < sources.length ? i + 1 : i));
  };

  if (url) {
    return (
      <div className={wrapClass} style={boxStyle}>
        <img
          src={url}
          alt={`${team} flag`}
          className="team-flag-img"
          width={circle ? undefined : px}
          height={circle ? undefined : Math.round(px * 0.68)}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={bumpFallback}
        />
      </div>
    );
  }

  const iso = teamFlagIso(team);
  return (
    <div
      className={`team-flag-fallback${circle ? " team-flag-fallback--circle" : ""}`}
      style={boxStyle}
      title={team}
    >
      <span>{iso ? iso.toUpperCase() : initials(team)}</span>
    </div>
  );
}
