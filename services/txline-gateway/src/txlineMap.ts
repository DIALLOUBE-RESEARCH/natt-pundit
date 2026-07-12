import type { Fixture, MatchClock, MatchPhase, OddsLine, ScoresSnapshot } from "@natt-pundit/contracts";
import { displayMinuteFromSeconds, wcMatchFormat } from "@natt-pundit/natt-core";

export type TxlineFixtureRow = {
  FixtureId: number;
  Participant1: string;
  Participant2: string;
  Participant1IsHome: boolean;
  StartTime: number;
  Competition?: string;
  CompetitionId?: number;
  Ts?: number;
};

export type TxlineOddsRow = {
  FixtureId: number;
  Ts: number;
  SuperOddsType: string;
  MarketPeriod: string | null;
  PriceNames: string[];
  Prices: number[];
  Pct: string[];
};

type TxlineParticipantScore = {
  Total?: { Goals?: number } & Record<string, unknown>;
  PE?: { Goals?: number };
  HT?: { Goals?: number };
  H1?: { Goals?: number };
} & Record<string, unknown>;

export type TxlineScoreRow = {
  FixtureId: number;
  Ts: number;
  GameState?: string;
  Action?: string;
  StatusId?: number;
  Seq?: number;
  Participant1IsHome?: boolean;
  Participant1Id?: number;
  Participant2Id?: number;
  Clock?: { Running?: boolean; Seconds?: number };
  Score?: {
    Participant1?: TxlineParticipantScore;
    Participant2?: TxlineParticipantScore;
  };
  Participant?: number;
  Data?: Record<string, unknown>;
  Stats?: Record<string, unknown>;
  Lineups?: Array<{
    normativeId?: number;
    preferredName?: string;
    lineups?: Array<{
      fixturePlayerId?: number;
      player?: { normativeId?: number; preferredName?: string };
    }>;
  }>;
};

const MATCH_MS = 2.5 * 60 * 60 * 1000;

function msToIso(ms: number): string {
  return new Date(ms).toISOString();
}

function pctToImplied(pct: string | undefined): number {
  if (!pct) return 0;
  const cleaned = pct.trim().replace("%", "");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 1 && n <= 100) return Math.min(1, Math.max(0, n / 100));
  if (n > 0 && n <= 1) return n;
  return 0;
}

function priceToImplied(price: number | undefined): number {
  if (price === undefined || !Number.isFinite(price) || price <= 1) return 0;
  return Math.min(1, Math.max(0, 1 / price));
}

function rowImplied(row: TxlineOddsRow, index: number): number {
  const fromPct = pctToImplied(row.Pct[index]);
  if (fromPct > 0) return fromPct;
  return priceToImplied(row.Prices[index]);
}

function normSuperOddsType(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function mapGameState(gameState: string | undefined, startMs: number): Fixture["status"] {
  const gs = (gameState ?? "").toLowerCase();
  if (gs.includes("finish") || gs.includes("post") || gs.includes("ended")) return "finished";
  if (gs.includes("live") || gs.includes("play") || gs.includes("half")) return "live";

  const now = Date.now();
  if (startMs > now + 15 * 60 * 1000) return "scheduled";
  if (startMs < now - MATCH_MS) return "finished";
  if (startMs <= now) return "live";
  return "scheduled";
}

function participantGoals(p: TxlineParticipantScore | undefined): number {
  const g = p?.Total?.Goals;
  return typeof g === "number" && Number.isFinite(g) ? Math.max(0, Math.trunc(g)) : 0;
}

/**
 * Goals per participant on a single row (partial rows may only update one side).
 */
function goalsAtRow(
  r: TxlineScoreRow,
  p1IsHome: boolean,
): { home: number; away: number } {
  const p1 = participantGoals(r.Score?.Participant1);
  const p2 = participantGoals(r.Score?.Participant2);
  return p1IsHome ? { home: p1, away: p2 } : { home: p2, away: p1 };
}

/** Live: per-side max — only update a side when that participant's Goals field is present on the row. */
function readGoalsPerSideMax(rows: TxlineScoreRow[]): { home: number; away: number } {
  let p1IsHome = true;
  let home = 0;
  let away = 0;
  for (const r of rows) {
    if (typeof r.Participant1IsHome === "boolean") p1IsHome = r.Participant1IsHome;
    const p1 = r.Score?.Participant1?.Total?.Goals;
    const p2 = r.Score?.Participant2?.Total?.Goals;
    if (typeof p1 === "number" && Number.isFinite(p1)) {
      const g = Math.max(0, Math.trunc(p1));
      if (p1IsHome) home = Math.max(home, g);
      else away = Math.max(away, g);
    }
    if (typeof p2 === "number" && Number.isFinite(p2)) {
      const g = Math.max(0, Math.trunc(p2));
      if (p1IsHome) away = Math.max(away, g);
      else home = Math.max(home, g);
    }
  }
  return { home, away };
}

/** @deprecated alias — use readGoalsPerSideMax */
function readGoalsMonotonicMax(rows: TxlineScoreRow[]): { home: number; away: number } {
  return readGoalsPerSideMax(rows);
}

function isPenaltyShootoutAction(action: string): boolean {
  return (
    action.includes("penalty_shootout") ||
    action.includes("penaltyshootout") ||
    action.includes("penalty_shoot")
  );
}

/** True when TxLINE signals post-ET penalty shootout (not an in-match regulation penalty). */
export function isPenaltyShootoutContext(rows: TxlineScoreRow[]): boolean {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  for (const r of asc) {
    if (isPenaltyShootoutAction((r.Action ?? "").toLowerCase())) return true;
  }
  return readPenShootoutScore(rows) != null;
}

/**
 * Live score: per-side max, but ignore noisy partial score rows while a regulation
 * penalty is pending (TxLINE often emits wrong away/home totals until outcome).
 */
function readGoalsLive(rows: TxlineScoreRow[]): { home: number; away: number } {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  const shootout = isPenaltyShootoutContext(rows);
  let p1IsHome = true;
  let home = 0;
  let away = 0;
  let regPenaltyPending = false;

  for (const r of asc) {
    if (typeof r.Participant1IsHome === "boolean") p1IsHome = r.Participant1IsHome;
    const action = (r.Action ?? "").toLowerCase();

    if (!shootout && action === "penalty") {
      regPenaltyPending = true;
      continue;
    }
    if (regPenaltyPending) {
      if (action === "penalty_outcome") {
        regPenaltyPending = false;
      } else if (action !== "goal" && action !== "goal_penalty") {
        continue;
      }
    }

    const p1 = r.Score?.Participant1?.Total?.Goals;
    const p2 = r.Score?.Participant2?.Total?.Goals;
    if (typeof p1 === "number" && Number.isFinite(p1)) {
      const g = Math.max(0, Math.trunc(p1));
      if (p1IsHome) home = Math.max(home, g);
      else away = Math.max(away, g);
    }
    if (typeof p2 === "number" && Number.isFinite(p2)) {
      const g = Math.max(0, Math.trunc(p2));
      if (p1IsHome) away = Math.max(away, g);
      else home = Math.max(home, g);
    }
  }

  return { home, away };
}

function isGoalAction(action: string): boolean {
  const a = action.toLowerCase();
  if (a === "action_discarded") return false;
  return a === "goal" || a === "goal_penalty" || a === "penalty_goal";
}

function countGoalActions(
  rows: TxlineScoreRow[],
  p1IsHome: boolean,
): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const r of rows) {
    const action = (r.Action ?? "").toLowerCase();
    if (!isGoalAction(action)) continue;
    const team = eventTeam(r.Participant, p1IsHome);
    if (team === "home") home += 1;
    else if (team === "away") away += 1;
  }
  return { home, away };
}

/** FT: last snapshot row with score totals (game_finalised row often has no Score). */
function readGoalsAtFullTime(rows: TxlineScoreRow[]): { home: number; away: number } {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  let p1IsHome = true;

  for (let i = asc.length - 1; i >= 0; i -= 1) {
    if (typeof asc[i]?.Participant1IsHome === "boolean") {
      p1IsHome = asc[i]!.Participant1IsHome!;
    }
    const at = goalsAtRow(asc[i]!, p1IsHome);
    if (at.home > 0 || at.away > 0) return at;
  }

  return { home: 0, away: 0 };
}

function readGoalsFromRows(
  rows: TxlineScoreRow[],
  phase: MatchPhase = "pre",
): { home: number; away: number } {
  let p1IsHome = true;
  for (const r of rows) {
    if (typeof r.Participant1IsHome === "boolean") p1IsHome = r.Participant1IsHome;
  }
  const fromActions = countGoalActions(rows, p1IsHome);

  if (phase === "FT") {
    const fromFt = readGoalsAtFullTime(rows);
    const actionTotal = fromActions.home + fromActions.away;
    const ftTotal = fromFt.home + fromFt.away;
    if (actionTotal > 0 && actionTotal === ftTotal) {
      return fromActions;
    }
    if (ftTotal > 0) return fromFt;
    return fromActions;
  }

  const fromMax = readGoalsLive(rows);
  if (fromMax.home + fromMax.away > 0) return fromMax;
  return fromActions;
}

/**
 * Derive live phase from chronological action signals (GameState is unreliable,
 * always "scheduled" in prod). Minute comes from the latest running Clock.
 */
function deriveClock(rows: TxlineScoreRow[]): MatchClock {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  let phase: MatchPhase = "pre";
  let seenHalftime = false;
  let sawPenaltySignal = false;
  for (const r of asc) {
    const action = (r.Action ?? "").toLowerCase();
    if (action.includes("game_finalis") || action.includes("fulltime_finalis")) {
      phase = "FT";
    } else if (action.includes("secondhalf_kickoff") || action.includes("2nd_half")) {
      phase = "2H";
    } else if (action.includes("halftime_finalis") || action === "halftime") {
      phase = "HT";
      seenHalftime = true;
    } else if (
      isPenaltyShootoutAction(action) ||
      action.includes("penalties")
    ) {
      phase = "PEN";
      sawPenaltySignal = true;
    } else if (action.includes("extratime") || action.includes("extra_time")) {
      phase = "ET";
    } else if (action === "kickoff" || action.includes("firsthalf_kickoff")) {
      phase = seenHalftime ? "2H" : "1H";
    }
  }

  const goalsAtEnd = readGoalsMonotonicMax(asc);
  const tied = goalsAtEnd.home === goalsAtEnd.away && goalsAtEnd.home + goalsAtEnd.away > 0;

  // FT fallback: TxLine does not always emit game_finalised. Never mark FT when
  // penalties are active, or when ET ends level (tirs au but — not "finished").
  if (!sawPenaltySignal && phase !== "PEN" && (phase === "2H" || phase === "ET")) {
    let latestClock: TxlineScoreRow["Clock"] | undefined;
    for (let i = asc.length - 1; i >= 0; i -= 1) {
      if (asc[i]?.Clock) {
        latestClock = asc[i].Clock;
        break;
      }
    }
    let peakRunningSec = 0;
    for (const r of asc) {
      if (r.Clock?.Running && typeof r.Clock.Seconds === "number" && Number.isFinite(r.Clock.Seconds)) {
        peakRunningSec = Math.max(peakRunningSec, r.Clock.Seconds);
      }
    }
    const ftThresholdSec = phase === "ET" ? 120 * 60 : 90 * 60;
    const stoppedAndReset =
      latestClock?.Running === false && (latestClock.Seconds ?? 0) === 0;
    if (stoppedAndReset && peakRunningSec >= ftThresholdSec) {
      if (phase === "ET" && tied) {
        phase = "PEN";
        sawPenaltySignal = true;
      } else if (phase === "2H" && tied) {
        // Level at 90' in knockout → extra time, not full-time.
      } else {
        phase = "FT";
      }
    }
  }

  if (sawPenaltySignal && phase !== "FT") {
    phase = "PEN";
  }

  const running =
    phase !== "FT" &&
    (phase === "1H" || phase === "2H" || phase === "ET" || phase === "PEN");
  let seconds: number | undefined;
  if (running) {
    for (let i = asc.length - 1; i >= 0; i -= 1) {
      const c = asc[i]?.Clock;
      if (c && c.Running && typeof c.Seconds === "number" && Number.isFinite(c.Seconds)) {
        seconds = Math.max(0, Math.trunc(c.Seconds));
        break;
      }
    }
  }

  const minute =
    running && seconds !== undefined ? displayMinuteFromSeconds(seconds) : undefined;

  return { phase, minute, seconds, running: Boolean(running && seconds !== undefined) };
}

export function phaseToStatus(phase: MatchPhase): Fixture["status"] {
  if (phase === "FT") return "finished";
  if (phase === "pre") return "scheduled";
  return "live";
}

export function mapFixture(row: TxlineFixtureRow, gameState?: string): Fixture {
  const homeTeam = row.Participant1IsHome ? row.Participant1 : row.Participant2;
  const awayTeam = row.Participant1IsHome ? row.Participant2 : row.Participant1;
  const status = mapGameState(gameState, row.StartTime);

  // The fixtures snapshot carries no goals; live score comes from the scores
  // stream (see mapScores). Leave score undefined here to avoid fake 0-0.
  return {
    fixtureId: String(row.FixtureId),
    homeTeam,
    awayTeam,
    kickoffAt: msToIso(row.StartTime),
    status,
    competition: row.Competition,
    wcFormat: wcMatchFormat(msToIso(row.StartTime)),
  };
}

function isFullTime1x2(row: TxlineOddsRow): boolean {
  return (
    normSuperOddsType(row.SuperOddsType) === "1X2_PARTICIPANT_RESULT" &&
    (row.MarketPeriod === null || row.MarketPeriod === "")
  );
}

function isAny1x2(row: TxlineOddsRow): boolean {
  return normSuperOddsType(row.SuperOddsType) === "1X2_PARTICIPANT_RESULT";
}

function isFullTimeOu(row: TxlineOddsRow): boolean {
  return (
    normSuperOddsType(row.SuperOddsType) === "OVERUNDER_PARTICIPANT_GOALS" &&
    (row.MarketPeriod === null || row.MarketPeriod === "")
  );
}

function isFullTimeAh(row: TxlineOddsRow): boolean {
  return (
    normSuperOddsType(row.SuperOddsType) === "ASIANHANDICAP_PARTICIPANT_GOALS" &&
    (row.MarketPeriod === null || row.MarketPeriod === "")
  );
}

function hasImplied(row: TxlineOddsRow): boolean {
  if (!Array.isArray(row.PriceNames) || !row.PriceNames.length) return false;
  return row.PriceNames.some((_, i) => rowImplied(row, i) > 0);
}

function pickOddsGroup(rows: TxlineOddsRow[]): { market: string; group: TxlineOddsRow[] } | null {
  const picks: Array<{ market: string; filter: (r: TxlineOddsRow) => boolean }> = [
    { market: "1X2", filter: isFullTime1x2 },
    { market: "1X2", filter: isAny1x2 },
    { market: "OU", filter: isFullTimeOu },
    { market: "AH", filter: isFullTimeAh },
    { market: "LINE", filter: hasImplied },
  ];
  for (const pick of picks) {
    const group = rows.filter(pick.filter).sort((a, b) => a.Ts - b.Ts);
    if (group.length) return { market: pick.market, group };
  }
  return null;
}

function selectionLabel(name: string, market: string): string {
  if (market === "OU") {
    if (name === "part1" || name === "over") return "over";
    if (name === "part2" || name === "under") return "under";
  }
  if (name === "part1") return "home";
  if (name === "part2") return "away";
  if (name === "draw") return "draw";
  return name;
}

export function mapOdds(fixtureId: string, rows: TxlineOddsRow[]): OddsLine[] {
  const picked = pickOddsGroup(rows);
  if (!picked) return [];

  const { market, group } = picked;
  const oldest = group[0];
  const latest = group[group.length - 1];
  const out: OddsLine[] = [];

  for (let i = 0; i < latest.PriceNames.length; i += 1) {
    const selection = selectionLabel(latest.PriceNames[i] ?? "", market);
    const implied = rowImplied(latest, i);
    const openImplied = rowImplied(oldest, i);
    if (implied <= 0) continue;
    out.push({
      fixtureId,
      market,
      selection,
      implied,
      openImplied: openImplied > 0 ? openImplied : undefined,
      ts: msToIso(latest.Ts),
    });
  }

  out.sort((a, b) => {
    const order: Record<string, number> = { home: 0, over: 0, draw: 1, away: 2, under: 2 };
    return (order[a.selection] ?? 9) - (order[b.selection] ?? 9);
  });

  return out;
}

function clockMinute(row: TxlineScoreRow): number | undefined {
  const sec = row.Clock?.Seconds;
  if (typeof sec === "number" && Number.isFinite(sec) && sec > 0) {
    return displayMinuteFromSeconds(sec);
  }
  return undefined;
}

function eventTeam(part: number | undefined, p1IsHome: boolean): "home" | "away" | undefined {
  if (part === 1) return p1IsHome ? "home" : "away";
  if (part === 2) return p1IsHome ? "away" : "home";
  return undefined;
}

type MappedEvent = NonNullable<ScoresSnapshot["events"]>[number];

function isTimelineAction(action: string): boolean {
  return (
    action === "goal" ||
    action.endsWith("_card") ||
    action.includes("substitution") ||
    action === "penalty_outcome"
  );
}

function eventParticipant(r: TxlineScoreRow): number | undefined {
  if (typeof r.Participant === "number") return r.Participant;
  const fromData = r.Data?.Participant;
  if (typeof fromData === "number") return fromData;
  return undefined;
}

function mapActionEvent(
  r: TxlineScoreRow,
  p1IsHome: boolean,
  playerSide: Map<number, "home" | "away">,
  nameLookup: Map<number, string>,
): MappedEvent {
  const data = r.Data ?? {};
  const playerInId = data.PlayerInId;
  const playerOutId = data.PlayerOutId;
  const action = (r.Action ?? "event").toLowerCase();
  let team = eventTeam(eventParticipant(r), p1IsHome);
  if (action.includes("substitution")) {
    const outId = typeof playerOutId === "number" ? playerOutId : undefined;
    const inId = typeof playerInId === "number" ? playerInId : undefined;
    team = (outId != null ? playerSide.get(outId) : undefined) ?? (inId != null ? playerSide.get(inId) : undefined) ?? team;
  }
  const playerId =
    typeof data.PlayerId === "number"
      ? data.PlayerId
      : typeof playerOutId === "number"
        ? playerOutId
        : undefined;
  const subLabel =
    typeof playerInId === "number" && typeof playerOutId === "number"
      ? `${resolvePlayerLabel(nameLookup, playerOutId) ?? `#${playerOutId}`} → ${resolvePlayerLabel(nameLookup, playerInId) ?? `#${playerInId}`}`
      : undefined;
  return {
    type: action,
    minute: clockMinute(r),
    player: subLabel ?? resolvePlayerLabel(nameLookup, playerId),
    team,
  };
}

function rowSeq(r: TxlineScoreRow): number | undefined {
  const candidates = [r.Seq, r.Data?.seq, r.Data?.Seq, r.Data?.updateSeq];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return Math.trunc(c);
  }
  return undefined;
}

/** Map fixturePlayerId / normativeId -> home|away from lineups rows. */
function buildPlayerLookup(
  rows: TxlineScoreRow[],
  p1IsHome: boolean,
): Map<number, "home" | "away"> {
  const map = new Map<number, "home" | "away">();
  for (const r of rows) {
    if ((r.Action ?? "").toLowerCase() !== "lineups" || !Array.isArray(r.Lineups)) continue;
    const p1Home = typeof r.Participant1IsHome === "boolean" ? r.Participant1IsHome : p1IsHome;
    for (let i = 0; i < r.Lineups.length; i += 1) {
      const block = r.Lineups[i]!;
      const side: "home" | "away" =
        i === 0 ? (p1Home ? "home" : "away") : p1Home ? "away" : "home";
      for (const lp of block.lineups ?? []) {
        if (typeof lp.fixturePlayerId === "number") map.set(lp.fixturePlayerId, side);
        const nid = lp.player?.normativeId;
        if (typeof nid === "number") map.set(nid, side);
      }
    }
  }
  return map;
}

function resolvePlayerLabel(
  lookup: Map<number, string>,
  playerId: number | undefined,
): string | undefined {
  if (typeof playerId !== "number") return undefined;
  const name = lookup.get(playerId);
  return name ?? `#${playerId}`;
}

function buildPlayerNameLookup(rows: TxlineScoreRow[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const r of rows) {
    if ((r.Action ?? "").toLowerCase() !== "lineups" || !Array.isArray(r.Lineups)) continue;
    for (const block of r.Lineups) {
      for (const lp of block.lineups ?? []) {
        const name = lp.player?.preferredName;
        if (!name) continue;
        if (typeof lp.fixturePlayerId === "number") map.set(lp.fixturePlayerId, name);
        const nid = lp.player?.normativeId;
        if (typeof nid === "number") map.set(nid, name);
      }
    }
  }
  return map;
}

function periodGoals(
  p: TxlineParticipantScore | undefined,
): number {
  const ht = p?.HT?.Goals;
  const h1 = p?.H1?.Goals;
  const total = p?.Total?.Goals;
  if (typeof ht === "number" && ht > 0) return Math.trunc(ht);
  if (typeof h1 === "number" && h1 > 0) return Math.trunc(h1);
  if (typeof total === "number" && total > 0) return Math.trunc(total);
  return 0;
}

function inferMinuteForRow(action: string, minute: number | undefined): number | undefined {
  if (minute != null) return minute;
  if (action === "halftime_finalised" || action.includes("halftime")) return 45;
  return undefined;
}

function countTeamGoals(goals: MappedEvent[], team: "home" | "away"): number {
  return goals.filter((g) => g.type === "goal" && g.team === team).length;
}

function hasGoalAtMinute(
  goals: MappedEvent[],
  team: "home" | "away",
  minute: number | undefined,
): boolean {
  if (minute == null) return false;
  return goals.some((g) => g.type === "goal" && g.team === team && g.minute === minute);
}

/**
 * Regulation goals: explicit goal actions + earliest score-delta (HT row for 1st-half goals).
 * Avoids duplicating both teams at the same wrong minute.
 */
function buildRegulationGoals(
  rows: TxlineScoreRow[],
  p1IsHome: boolean,
  finalScore: { home: number; away: number },
  nameLookup: Map<number, string>,
): MappedEvent[] {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  const goals: MappedEvent[] = [];
  let homeFlag = p1IsHome;

  for (const r of asc) {
    if ((r.Action ?? "").toLowerCase() !== "goal") continue;
    if (typeof r.Participant1IsHome === "boolean") homeFlag = r.Participant1IsHome;
    const team = eventTeam(r.Participant, homeFlag);
    if (!team) continue;
    const playerId = r.Data?.PlayerId;
    const pid = typeof playerId === "number" ? playerId : undefined;
    const minute = clockMinute(r);
    if (!hasGoalAtMinute(goals, team, minute)) {
      goals.push({
        type: "goal",
        team,
        minute,
        player: resolvePlayerLabel(nameLookup, pid),
      });
    }
  }

  let prevHome = 0;
  let prevAway = 0;
  for (const r of asc) {
    if (typeof r.Participant1IsHome === "boolean") homeFlag = r.Participant1IsHome;
    const action = (r.Action ?? "").toLowerCase();
    const minute = inferMinuteForRow(action, clockMinute(r));

    if (action === "halftime_finalised" && r.Score) {
      const p1 = r.Score.Participant1;
      const p2 = r.Score.Participant2;
      const htHome = homeFlag ? periodGoals(p1) : periodGoals(p2);
      const htAway = homeFlag ? periodGoals(p2) : periodGoals(p1);
      while (countTeamGoals(goals, "home") < htHome && htHome <= finalScore.home) {
        if (!hasGoalAtMinute(goals, "home", 45)) {
          goals.push({ type: "goal", team: "home", minute: 45 });
        } else break;
      }
      while (countTeamGoals(goals, "away") < htAway && htAway <= finalScore.away) {
        if (!hasGoalAtMinute(goals, "away", 45)) {
          goals.push({ type: "goal", team: "away", minute: 45 });
        } else break;
      }
      prevHome = Math.max(prevHome, htHome);
      prevAway = Math.max(prevAway, htAway);
    }

    const at = goalsAtRow(r, homeFlag);
    if (at.home > prevHome) {
      const delta = at.home - prevHome;
      for (let d = 0; d < delta; d += 1) {
        if (countTeamGoals(goals, "home") >= finalScore.home) break;
        goals.push({ type: "goal", team: "home", minute });
      }
    }
    if (at.away > prevAway) {
      const delta = at.away - prevAway;
      for (let d = 0; d < delta; d += 1) {
        if (countTeamGoals(goals, "away") >= finalScore.away) break;
        goals.push({ type: "goal", team: "away", minute });
      }
    }
    prevHome = Math.max(prevHome, at.home);
    prevAway = Math.max(prevAway, at.away);
  }

  const homeGoals = goals
    .filter((g) => g.team === "home")
    .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    .slice(0, finalScore.home);
  const awayGoals = goals
    .filter((g) => g.team === "away")
    .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    .slice(0, finalScore.away);
  return [...homeGoals, ...awayGoals].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
}

function penaltyRowSeq(r: TxlineScoreRow): number {
  const candidates = [r.Seq, r.Data?.seq, r.Data?.Seq, r.Data?.updateSeq];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return Math.trunc(c);
  }
  return r.Ts;
}

function penaltyOutcomeKey(r: TxlineScoreRow): string {
  return String(r.Data?.Outcome ?? "").toLowerCase();
}

/** TxLINE emits duplicate penalty_outcome bursts per kick — keep richest row per kick. */
export function dedupePenaltyOutcomes(rows: TxlineScoreRow[]): TxlineScoreRow[] {
  const pens = rows
    .filter((r) => (r.Action ?? "").toLowerCase() === "penalty_outcome")
    .sort((a, b) => penaltyRowSeq(a) - penaltyRowSeq(b));

  const out: TxlineScoreRow[] = [];
  for (const r of pens) {
    const last = out[out.length - 1];
    if (last) {
      const sameBurst =
        last.Participant === r.Participant && penaltyOutcomeKey(last) === penaltyOutcomeKey(r);
      if (sameBurst) {
        const hasPlayer = typeof r.Data?.PlayerId === "number";
        const lastHas = typeof last.Data?.PlayerId === "number";
        if (hasPlayer && !lastHas) out[out.length - 1] = r;
        else if (hasPlayer === lastHas) out[out.length - 1] = r;
        continue;
      }
    }
    out.push(r);
  }
  return out;
}

function buildRegulationPenaltyOutcomes(
  rows: TxlineScoreRow[],
  p1IsHome: boolean,
  playerSide: Map<number, "home" | "away">,
  nameLookup: Map<number, string>,
): MappedEvent[] {
  if (isPenaltyShootoutContext(rows)) return [];
  const penRows = dedupePenaltyOutcomes(rows);
  let homeFlag = p1IsHome;
  const out: MappedEvent[] = [];
  for (const r of penRows) {
    if (typeof r.Participant1IsHome === "boolean") homeFlag = r.Participant1IsHome;
    const data = r.Data ?? {};
    const outcome = String(data.Outcome ?? "").toLowerCase();
    const scored = outcome.includes("scor") || outcome.includes("goal");
    const playerId = typeof data.PlayerId === "number" ? data.PlayerId : undefined;
    const fromPlayer = playerId != null ? playerSide.get(playerId) : undefined;
    const team = fromPlayer ?? eventTeam(r.Participant, homeFlag);
    if (!team) continue;
    if (scored) {
      out.push({
        type: "goal",
        minute: clockMinute(r),
        team,
        player: resolvePlayerLabel(nameLookup, playerId),
      });
    }
  }
  return out;
}

function buildPenaltyEvents(
  rows: TxlineScoreRow[],
  p1IsHome: boolean,
  playerSide: Map<number, "home" | "away">,
  nameLookup: Map<number, string>,
): MappedEvent[] {
  if (!isPenaltyShootoutContext(rows)) return [];
  const penRows = dedupePenaltyOutcomes(rows);
  let homeFlag = p1IsHome;
  const out: MappedEvent[] = [];
  let penIndex = 0;
  for (const r of penRows) {
    if (typeof r.Participant1IsHome === "boolean") homeFlag = r.Participant1IsHome;
    const data = r.Data ?? {};
    const outcome = String(data.Outcome ?? "").toLowerCase();
    const type =
      outcome.includes("scor") || outcome.includes("goal") ? "penalty_goal" : "penalty_miss";
    const playerId = typeof data.PlayerId === "number" ? data.PlayerId : undefined;
    const fromPlayer = playerId != null ? playerSide.get(playerId) : undefined;
    const team = fromPlayer ?? eventTeam(r.Participant, homeFlag);
    penIndex += 1;
    out.push({
      type,
      minute: 120 + penIndex,
      team,
      player: resolvePlayerLabel(nameLookup, playerId),
    });
  }
  return out;
}

function miscEventBucket(type: string): string {
  const a = type.toLowerCase();
  if (a.includes("substitution")) return "substitution";
  if (a.endsWith("_card")) return a;
  return a;
}

/** TxLINE often emits a stub substitution/card row then a detailed row — keep detail only. */
function dedupeMiscEvents(events: MappedEvent[]): MappedEvent[] {
  const groups = new Map<string, MappedEvent[]>();
  for (const e of events) {
    const key = `${e.minute ?? "na"}|${e.team ?? "neutral"}|${miscEventBucket(e.type)}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const out: MappedEvent[] = [];
  for (const list of groups.values()) {
    if (list.length === 1) {
      out.push(list[0]!);
      continue;
    }

    const bucket = miscEventBucket(list[0]!.type);
    if (bucket === "substitution") {
      const detailed = list.filter((e) => e.player?.includes("→"));
      if (detailed.length > 0) {
        const seen = new Set<string>();
        for (const e of detailed) {
          const key = e.player ?? "";
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(e);
        }
      } else {
        out.push(list[list.length - 1]!);
      }
      continue;
    }

    const seenPlayers = new Set<string>();
    for (const e of list) {
      const p = e.player?.trim() ?? "";
      if (p) {
        if (seenPlayers.has(p)) continue;
        seenPlayers.add(p);
        out.push(e);
      }
    }
    if (seenPlayers.size === 0) {
      out.push(list[list.length - 1]!);
    }
  }

  return out;
}

/** Drop substitution rows without swap detail when richer rows exist at the same minute. */
function collapseSubstitutionStubs(events: MappedEvent[]): MappedEvent[] {
  const detailedByMinute = new Map<number, MappedEvent[]>();
  for (const e of events) {
    if (!e.type.includes("substitution") || !e.player?.includes("→") || e.minute == null) continue;
    const list = detailedByMinute.get(e.minute) ?? [];
    list.push(e);
    detailedByMinute.set(e.minute, list);
  }

  return events.filter((e) => {
    if (!e.type.includes("substitution")) return true;
    if (e.player?.includes("→")) return true;
    if (e.minute == null) return true;
    const detailed = detailedByMinute.get(e.minute) ?? [];
    if (detailed.length === 0) return true;
    if (detailed.some((d) => d.team === e.team)) return false;
    if (!e.player?.trim()) return false;
    return true;
  });
}

function mergeTimelineEvents(
  rows: TxlineScoreRow[],
  p1IsHome: boolean,
  finalScore: { home: number; away: number },
  _phase: MatchPhase,
): MappedEvent[] {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  const playerSide = buildPlayerLookup(rows, p1IsHome);
  const nameLookup = buildPlayerNameLookup(rows);

  const misc = collapseSubstitutionStubs(
    dedupeMiscEvents(
      asc
        .filter((r) => {
          const a = (r.Action ?? "").toLowerCase();
          return (a.endsWith("_card") || a.includes("substitution")) && a !== "action_discarded";
        })
        .map((r) => mapActionEvent(r, p1IsHome, playerSide, nameLookup)),
    ),
  );

  const goals = buildRegulationGoals(rows, p1IsHome, finalScore, nameLookup);
  const regPenGoals = buildRegulationPenaltyOutcomes(rows, p1IsHome, playerSide, nameLookup);
  const pens = buildPenaltyEvents(rows, p1IsHome, playerSide, nameLookup);

  const mergedGoals = [...goals];
  for (const g of regPenGoals) {
    if (g.team === "home" || g.team === "away") {
      if (!hasGoalAtMinute(mergedGoals, g.team, g.minute)) {
        mergedGoals.push(g);
      }
    }
  }

  return [...misc, ...mergedGoals, ...pens]
    .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    .slice(-50);
}

function readPenShootoutScore(
  rows: TxlineScoreRow[],
): { home: number; away: number } | undefined {
  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  let p1IsHome = true;
  for (let i = asc.length - 1; i >= 0; i -= 1) {
    const r = asc[i]!;
    if (typeof r.Participant1IsHome === "boolean") p1IsHome = r.Participant1IsHome;
    const pe1 = r.Score?.Participant1?.PE?.Goals;
    const pe2 = r.Score?.Participant2?.PE?.Goals;
    if (typeof pe1 === "number" && typeof pe2 === "number" && (pe1 > 0 || pe2 > 0)) {
      return p1IsHome ? { home: pe1, away: pe2 } : { home: pe2, away: pe1 };
    }
  }
  return undefined;
}

export function mapScores(fixtureId: string, rows: TxlineScoreRow[]): ScoresSnapshot | null {
  if (!rows.length) return null;

  const asc = [...rows].sort((a, b) => a.Ts - b.Ts);
  const latest = asc[asc.length - 1];
  const clock = deriveClock(rows);
  const goals = readGoalsFromRows(rows, clock.phase);
  const penScore = readPenShootoutScore(rows);

  let p1IsHome = true;
  for (const r of rows) {
    if (typeof r.Participant1IsHome === "boolean") p1IsHome = r.Participant1IsHome;
  }

  const events = mergeTimelineEvents(rows, p1IsHome, goals, clock.phase);

  return {
    fixtureId,
    score: goals,
    clock,
    penScore,
    participant1IsHome: p1IsHome,
    events,
    ts: msToIso(latest.Ts),
  };
}

export function oddsDebugSummary(fixtureId: string, rows: TxlineOddsRow[]) {
  const superTypes = [...new Set(rows.map((r) => r.SuperOddsType))];
  const mapped = mapOdds(fixtureId, rows);
  return {
    fixtureId,
    rawCount: rows.length,
    superOddsTypes: superTypes,
    mappedCount: mapped.length,
    sample: rows.slice(0, 2).map((r) => ({
      SuperOddsType: r.SuperOddsType,
      MarketPeriod: r.MarketPeriod,
      PriceNames: r.PriceNames,
      Pct: r.Pct,
      Prices: r.Prices,
    })),
    mapped,
  };
}

export function wcCompetitionId(): number | null {
  const raw = process.env.TXLINE_COMPETITION_ID?.trim();
  if (!raw) return 72;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 72;
}
