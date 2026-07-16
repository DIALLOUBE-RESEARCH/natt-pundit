import { useEffect, useMemo, useState } from "react";
import { teamFlagImageSources, teamFlagIso } from "@/lib/countryFlags";
import { canonicalTeamKey } from "@/lib/teamI18n";
import { initials } from "@/lib/teamColors";

type Props = {
  team: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "circle" | "rect";
  muted?: boolean;
};

const SIZES = { xs: 32, sm: 40, md: 48, lg: 56, xl: 64 };

export function TeamFlag({
  team,
  size = "md",
  variant = "rect",
  muted = false,
}: Props) {
  const px = SIZES[size];
  const circle = variant === "circle";

  const flagTeam = useMemo(() => canonicalTeamKey(team) ?? team, [team]);

  const sources = useMemo(
    () => teamFlagImageSources(flagTeam, { circle, size }),
    [flagTeam, size, circle],
  );
  const sourcesKey = sources.join("|");

  const [sourceIndex, setSourceIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setExhausted(false);
  }, [team, sourcesKey]);

  const url = !exhausted && sources.length > 0 ? (sources[sourceIndex] ?? null) : null;

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
    setSourceIndex((i) => {
      if (i + 1 < sources.length) return i + 1;
      setExhausted(true);
      return i;
    });
  };

  if (url) {
    return (
      <div className={wrapClass} style={boxStyle}>
        <img
          key={url}
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

  const iso = teamFlagIso(flagTeam);
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
