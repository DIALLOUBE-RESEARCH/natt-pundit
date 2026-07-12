/** Finite commentary event types (F76N). Closed enum — new types need spec bump. */
export const COMMENTARY_EVENT_TYPES = [
  "MATCH_KICKOFF",
  "GOAL",
  "GOAL_PENALTY",
  "PENALTY_AWARDED",
  "PENALTY_MISSED",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION",
  "VAR_START",
  "VAR_END",
  "CORNER",
  "SHOT",
  "INJURY",
  "HALFTIME",
  "SECOND_HALF_START",
  "ADDITIONAL_TIME",
  "FULLTIME",
  "EXTRA_TIME_START",
  "PENALTY_SHOOTOUT_START",
  "EDGE_SETUP",
  "EDGE_SETUP_LATCHED",
  "EDGE_HOLD",
] as const;

export type CommentaryEventType = (typeof COMMENTARY_EVENT_TYPES)[number];

export const COMMENTARY_LANGS = ["en", "fr", "es", "zh", "ja", "ru", "pt", "de"] as const;

export type CommentaryLang = (typeof COMMENTARY_LANGS)[number];

export type CommentaryVars = {
  player?: string;
  team?: string;
  teamShort?: string;
  minute?: number;
  scoreHome: number;
  scoreAway: number;
  homeTeam: string;
  awayTeam: string;
  additionalMin?: number;
  edgeDirection?: string;
};

export type CommentarySfx =
  | "none"
  | "goal_roar"
  | "goal_roar_long"
  | "card"
  | "whistle_ft"
  | "whistle_ht"
  | "tension"
  | "var"
  | "setup";

export function commentarySfxForEvent(type: CommentaryEventType): CommentarySfx {
  switch (type) {
    case "GOAL":
    case "GOAL_PENALTY":
      return "goal_roar";
    case "RED_CARD":
    case "YELLOW_CARD":
      return "card";
    case "FULLTIME":
      return "whistle_ft";
    case "HALFTIME":
      return "whistle_ht";
    case "VAR_START":
    case "VAR_END":
      return "var";
    case "EDGE_SETUP":
      return "setup";
    default:
      return "none";
  }
}
