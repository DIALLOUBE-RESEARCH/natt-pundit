import type { Fixture, OddsLine, ScoresSnapshot } from "@natt-pundit/contracts";

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

export type TxlineScoreRow = {
  FixtureId: number;
  Ts: number;
  GameState?: string;
  Action?: string;
  Data?: Record<string, unknown>;
  Stats?: Record<string, unknown>;
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

function readGoals(stats: Record<string, unknown> | undefined): { home: number; away: number } {
  if (!stats) return { home: 0, away: 0 };
  const pick = (...keys: string[]): number => {
    for (const k of keys) {
      const v = stats[k];
      if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.trunc(v));
    }
    return 0;
  };
  return {
    home: pick("Goals1", "HomeGoals", "Participant1Goals", "home", "Home"),
    away: pick("Goals2", "AwayGoals", "Participant2Goals", "away", "Away"),
  };
}

export function mapFixture(row: TxlineFixtureRow, gameState?: string): Fixture {
  const homeTeam = row.Participant1IsHome ? row.Participant1 : row.Participant2;
  const awayTeam = row.Participant1IsHome ? row.Participant2 : row.Participant1;
  const status = mapGameState(gameState, row.StartTime);
  const goals = readGoals(undefined);

  return {
    fixtureId: String(row.FixtureId),
    homeTeam,
    awayTeam,
    kickoffAt: msToIso(row.StartTime),
    status,
    competition: row.Competition,
    score: status === "scheduled" ? undefined : goals,
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

export function mapScores(fixtureId: string, rows: TxlineScoreRow[]): ScoresSnapshot | null {
  if (!rows.length) return null;

  const sorted = [...rows].sort((a, b) => b.Ts - a.Ts);
  const latest = sorted[0];
  const goals = readGoals(latest.Stats);

  const events = sorted
    .filter((r) => {
      const action = (r.Action ?? "").toLowerCase();
      return action.includes("goal") || action.includes("card") || action.includes("sub");
    })
    .map((r) => ({
      type: (r.Action ?? "event").toLowerCase(),
      minute: typeof r.Data?.minute === "number" ? r.Data.minute : undefined,
      player: typeof r.Data?.player === "string" ? r.Data.player : undefined,
      team: typeof r.Data?.team === "string" ? r.Data.team : undefined,
    }))
    .slice(0, 20);

  return {
    fixtureId,
    score: goals,
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
