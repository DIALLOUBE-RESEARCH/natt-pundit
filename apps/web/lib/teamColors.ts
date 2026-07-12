export type TeamPalette = { primary: string; secondary: string };

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function teamPalette(team: string): TeamPalette {
  const h = hashName(team);
  const hue = h % 360;
  return {
    primary: `hsl(${hue} 72% 48%)`,
    secondary: `hsl(${(hue + 40) % 360} 55% 22%)`,
  };
}

export function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}
