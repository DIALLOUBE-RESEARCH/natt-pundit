import type { TeamPalette } from "@/lib/teamColors";
import { initials } from "@/lib/teamColors";

type Props = {
  team: string;
  palette: TeamPalette;
  size?: "sm" | "md" | "lg";
};

const SIZES = { sm: 40, md: 56, lg: 72 };

export function TeamShield({ team, palette, size = "md" }: Props) {
  const px = SIZES[size];
  return (
    <div
      className="team-shield"
      style={
        {
          width: px,
          height: px,
          "--shield-a": palette.primary,
          "--shield-b": palette.secondary,
        } as Record<string, string | number>
      }
    >
      <span>{initials(team)}</span>
    </div>
  );
}
