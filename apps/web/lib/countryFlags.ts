/** FIFA WC 2026 / TxLINE team name -> ISO 3166-1 alpha-2 for flagcdn.com */
const TEAM_ISO: Record<string, string> = {
  algeria: "dz",
  argentina: "ar",
  australia: "au",
  austria: "at",
  belgium: "be",
  "bosnia and herzegovina": "ba",
  "bosnia herzegovina": "ba",
  brazil: "br",
  "cabo verde": "cv",
  "cape verde": "cv",
  canada: "ca",
  colombia: "co",
  "congo dr": "cd",
  "dr congo": "cd",
  "congo drc": "cd",
  "democratic republic of congo": "cd",
  drc: "cd",
  "cote divoire": "ci",
  "cote d ivoire": "ci",
  "ivory coast": "ci",
  croatia: "hr",
  curacao: "cw",
  czechia: "cz",
  "czech republic": "cz",
  ecuador: "ec",
  egypt: "eg",
  england: "gb-eng",
  france: "fr",
  germany: "de",
  ghana: "gh",
  haiti: "ht",
  iran: "ir",
  "ir iran": "ir",
  iraq: "iq",
  italy: "it",
  jamaica: "jm",
  japan: "jp",
  jordan: "jo",
  "korea republic": "kr",
  "south korea": "kr",
  southkorea: "kr",
  mexico: "mx",
  morocco: "ma",
  netherlands: "nl",
  "new zealand": "nz",
  nigeria: "ng",
  norway: "no",
  panama: "pa",
  paraguay: "py",
  peru: "pe",
  poland: "pl",
  portugal: "pt",
  qatar: "qa",
  romania: "ro",
  "saudi arabia": "sa",
  saudiarabia: "sa",
  scotland: "gb-sct",
  senegal: "sn",
  serbia: "rs",
  "south africa": "za",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  tunisia: "tn",
  turkey: "tr",
  turkiye: "tr",
  uruguay: "uy",
  usa: "us",
  "united states": "us",
  ukraine: "ua",
  uzbekistan: "uz",
  wales: "gb-wls",
  // FIFA 3-letter broadcast codes
  eng: "gb-eng",
  col: "co",
  gha: "gh",
  par: "py",
  fra: "fr",
  bra: "br",
  // legacy / friendly aliases
  cameroon: "cm",
  chile: "cl",
  "costa rica": "cr",
  denmark: "dk",
  greece: "gr",
  ireland: "ie",
  "northern ireland": "gb-nir",
};

const ALIASES: Array<[RegExp, string]> = [
  [/ivoire|ivory/i, "ci"],
  [/congo\s*dr|dr\s*congo|drc/i, "cd"],
  [/cape\s*verde|cabo\s*verde/i, "cv"],
  [/curacao|cura[cç]ao/i, "cw"],
  [/bosnia/i, "ba"],
  [/czech/i, "cz"],
  [/korea/i, "kr"],
  [/turk/i, "tr"],
  [/iran/i, "ir"],
  [/united\s*states|^usa$/i, "us"],
];

function normalizeTeam(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function teamNameKey(name: string): string {
  return normalizeTeam(name);
}

export function teamFlagIso(team: string): string | null {
  const raw = team.trim();
  const n = normalizeTeam(raw);
  if (!n) return null;

  if (TEAM_ISO[n]) return TEAM_ISO[n];
  const compact = n.replace(/ /g, "");
  if (TEAM_ISO[compact]) return TEAM_ISO[compact];

  for (const [re, iso] of ALIASES) {
    if (re.test(raw) || re.test(n)) return iso;
  }

  for (const [key, iso] of Object.entries(TEAM_ISO)) {
    if (n === key || n.startsWith(`${key} `) || n.endsWith(` ${key}`)) return iso;
  }

  return null;
}

/** flagcdn.com widths: 20, 40, 80, 160, 320, 640 */
export function teamFlagUrl(team: string, width = 80): string | null {
  const iso = teamFlagIso(team);
  if (!iso) return null;
  const w = [20, 40, 80, 160, 320, 640].includes(width)
    ? width
    : width <= 40
      ? 40
      : width <= 80
        ? 80
        : 160;
  return `https://flagcdn.com/w${w}/${iso}.png`;
}

/** High-quality circular SVG flags (Stitch / iOS-grade). */
export function teamCircleFlagUrl(team: string): string | null {
  const iso = teamFlagIso(team);
  if (!iso) return null;
  return `https://hatscripts.github.io/circle-flags/flags/${iso.toLowerCase()}.svg`;
}

/** Nano Banana bundled flags (public/ui/flags/{iso}.png). */
export function teamNanoFlagUrl(team: string): string | null {
  const iso = teamFlagIso(team);
  if (!iso) return null;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "/fr/nattpundit";
  return `${base}/ui/flags/${iso.toLowerCase()}.png?v=norm1`;
}
