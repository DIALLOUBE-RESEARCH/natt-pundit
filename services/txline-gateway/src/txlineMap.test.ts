import { describe, expect, it } from "vitest";
import {
  dedupePenaltyOutcomes,
  isPenaltyShootoutContext,
  mapOdds,
  mapScores,
  type TxlineOddsRow,
  type TxlineScoreRow,
} from "./txlineMap.js";

function scoreRow(partial: Partial<TxlineScoreRow>): TxlineScoreRow {
  return { FixtureId: 1, Ts: Date.now(), ...partial };
}

describe("txlineMap", () => {
  it("maps_fulltime_1x2_pct", () => {
    const rows: TxlineOddsRow[] = [
      {
        FixtureId: 1,
        Ts: Date.now(),
        SuperOddsType: "1X2_PARTICIPANT_RESULT",
        MarketPeriod: null,
        PriceNames: ["part1", "draw", "part2"],
        Prices: [3.5, 3.2, 2.1],
        Pct: ["27.174%", "27.933%", "44.903%"],
      },
    ];
    const out = mapOdds("1", rows);
    expect(out).toHaveLength(3);
    expect(out[0]!.implied).toBeCloseTo(0.27174, 4);
  });

  it("falls_back_to_prices_when_pct_empty", () => {
    const rows: TxlineOddsRow[] = [
      {
        FixtureId: 2,
        Ts: Date.now(),
        SuperOddsType: "1x2_participant_result",
        MarketPeriod: "",
        PriceNames: ["part1", "part2"],
        Prices: [2.0, 2.0],
        Pct: ["", ""],
      },
    ];
    const out = mapOdds("2", rows);
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out[0]!.implied).toBeCloseTo(0.5, 4);
  });

  it("returns_empty_when_no_implied_data", () => {
    const rows: TxlineOddsRow[] = [
      {
        FixtureId: 3,
        Ts: Date.now(),
        SuperOddsType: "UNKNOWN",
        MarketPeriod: "1H",
        PriceNames: ["x"],
        Prices: [1],
        Pct: [""],
      },
    ];
    expect(mapOdds("3", rows)).toEqual([]);
  });
});

describe("mapScores", () => {
  it("reads_goals_from_score_total_with_home_mapping", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 2 } }, Participant2: { Total: { Goals: 1 } } },
      }),
    ];
    const out = mapScores("1", rows);
    expect(out?.score).toEqual({ home: 2, away: 1 });
  });

  it("swaps_goals_when_participant1_is_away", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Participant1IsHome: false,
        Score: { Participant1: { Total: { Goals: 2 } }, Participant2: { Total: { Goals: 1 } } },
      }),
    ];
    const out = mapScores("1", rows);
    expect(out?.score).toEqual({ home: 1, away: 2 });
  });

  it("takes_max_goals_across_partial_rows", () => {
    const rows = [
      scoreRow({ Ts: 1, Participant1IsHome: true, Score: { Participant1: { Total: { Goals: 1 } } } }),
      scoreRow({ Ts: 2, Participant1IsHome: true, Score: { Participant2: { Total: { Goals: 1 } } } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.score).toEqual({ home: 1, away: 1 });
  });

  it("derives_live_minute_from_running_clock_after_kickoff", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "attack_possession", Clock: { Running: true, Seconds: 2730 } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.clock?.phase).toBe("1H");
    expect(out?.clock?.minute).toBe(45);
    expect(out?.clock?.running).toBe(true);
  });

  it("flags_halftime_without_minute", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "halftime_finalised", Clock: { Running: false, Seconds: 2700 } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.clock?.phase).toBe("HT");
    expect(out?.clock?.minute).toBeUndefined();
  });

  it("flags_fulltime_when_game_finalised", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "halftime_finalised" }),
      scoreRow({ Ts: 3, Action: "secondhalf_kickoff", Clock: { Running: true, Seconds: 2701 } }),
      scoreRow({ Ts: 4, Action: "game_finalised" }),
    ];
    const out = mapScores("1", rows);
    expect(out?.clock?.phase).toBe("FT");
    expect(out?.clock?.running).toBe(false);
  });

  it("flags_fulltime_fallback_when_clock_stops_after_90_without_game_finalised", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "halftime_finalised" }),
      scoreRow({ Ts: 3, Action: "kickoff", Clock: { Running: true, Seconds: 2701 } }),
      scoreRow({ Ts: 4, Action: "attack_possession", Clock: { Running: true, Seconds: 5635 } }),
      scoreRow({ Ts: 5, Action: "clock_adjustment", Clock: { Running: false, Seconds: 0 } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.clock?.phase).toBe("FT");
    expect(out?.clock?.running).toBe(false);
    expect(out?.clock?.minute).toBeUndefined();
  });

  it("stays_live_when_clock_still_running_in_stoppage", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "halftime_finalised" }),
      scoreRow({ Ts: 3, Action: "kickoff", Clock: { Running: true, Seconds: 2701 } }),
      scoreRow({ Ts: 4, Action: "attack_possession", Clock: { Running: true, Seconds: 5635 } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.clock?.phase).toBe("2H");
    expect(out?.clock?.minute).toBe(93);
  });

  it("stays_live_when_clock_pauses_before_fulltime", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "halftime_finalised" }),
      scoreRow({ Ts: 3, Action: "kickoff", Clock: { Running: true, Seconds: 2701 } }),
      scoreRow({ Ts: 4, Action: "attack_possession", Clock: { Running: true, Seconds: 3600 } }),
      scoreRow({ Ts: 5, Action: "clock_adjustment", Clock: { Running: false, Seconds: 0 } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.clock?.phase).toBe("2H");
  });

  it("maps_goal_events_to_home_away_side", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Participant1IsHome: true, Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "goal", Participant: 1, Participant1IsHome: true, Clock: { Running: true, Seconds: 600 } }),
      scoreRow({ Ts: 3, Action: "goal", Participant: 2, Participant1IsHome: true, Clock: { Running: true, Seconds: 1500 } }),
    ];
    const out = mapScores("1", rows);
    const goals = out?.events.filter((e) => e.type === "goal") ?? [];
    expect(goals).toHaveLength(2);
    const byTeam = Object.fromEntries(goals.map((g) => [g.team, g.minute]));
    expect(byTeam.home).toBe(10);
    expect(byTeam.away).toBe(25);
  });

  it("swaps_event_side_when_participant1_is_away", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "goal", Participant: 1, Participant1IsHome: false, Clock: { Running: true, Seconds: 600 } }),
    ];
    const out = mapScores("1", rows);
    expect(out?.events[0]?.team).toBe("away");
  });

  it("excludes_action_discarded_from_events", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "action_discarded", Participant: 1, Clock: { Running: true, Seconds: 600 } }),
      scoreRow({ Ts: 2, Action: "goal", Participant: 1, Clock: { Running: true, Seconds: 660 } }),
      scoreRow({ Ts: 3, Action: "yellow_card", Participant: 2, Clock: { Running: true, Seconds: 720 } }),
    ];
    const out = mapScores("1", rows);
    const types = (out?.events ?? []).map((e) => e.type);
    expect(types).toContain("goal");
    expect(types).toContain("yellow_card");
    expect(types).not.toContain("action_discarded");
  });

  it("et_tied_clock_reset_goes_to_penalties_not_ft", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "kickoff", Clock: { Running: true, Seconds: 1 } }),
      scoreRow({ Ts: 2, Action: "halftime_finalised" }),
      scoreRow({ Ts: 3, Action: "secondhalf_kickoff", Clock: { Running: true, Seconds: 2701 } }),
      scoreRow({
        Ts: 4,
        Action: "extratime_firsthalf_kickoff",
        Clock: { Running: true, Seconds: 5401 },
      }),
      scoreRow({
        Ts: 5,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 1 } }, Participant2: { Total: { Goals: 1 } } },
        Clock: { Running: true, Seconds: 7200 },
      }),
      scoreRow({ Ts: 6, Action: "clock_adjustment", Clock: { Running: false, Seconds: 0 } }),
    ];
    const out = mapScores("aus-egy", rows);
    expect(out?.clock?.phase).toBe("PEN");
    expect(out?.clock?.phase).not.toBe("FT");
  });

  it("game_finalised_after_penalties_is_ft_with_pen_score", () => {
    const rows = [
      scoreRow({ Ts: 1, Action: "penalty_shootout_team", Participant: 1 }),
      scoreRow({
        Ts: 2,
        Action: "penalty_outcome",
        Participant: 2,
        Participant1IsHome: true,
        Score: {
          Participant1: { PE: { Goals: 2 }, Total: { Goals: 1 } },
          Participant2: { PE: { Goals: 4 }, Total: { Goals: 1 } },
        },
      }),
      scoreRow({
        Ts: 3,
        Action: "game_finalised",
        Participant1IsHome: true,
        Score: {
          Participant1: { PE: { Goals: 2 }, Total: { Goals: 1 } },
          Participant2: { PE: { Goals: 4 }, Total: { Goals: 1 } },
        },
      }),
    ];
    const out = mapScores("18176123", rows);
    expect(out?.clock?.phase).toBe("FT");
    expect(out?.clock?.running).toBe(false);
    expect(out?.penScore).toEqual({ home: 2, away: 4 });
  });

  it("aus_egy_ht_goal_and_late_equalizer_not_both_at_54", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Action: "halftime_finalised",
        Participant1IsHome: true,
        Score: {
          Participant1: { HT: { Goals: 0 } },
          Participant2: { H1: { Goals: 1 }, HT: { Goals: 1 } },
        },
      }),
      scoreRow({
        Ts: 2,
        Action: "goal",
        Participant: 1,
        Participant1IsHome: true,
        Data: { GoalType: "Own", PlayerId: 429899 },
        Clock: { Running: true, Seconds: 3242 },
        Score: {
          Participant1: { Total: { Goals: 1 } },
          Participant2: { Total: { Goals: 1 } },
        },
      }),
      scoreRow({
        Ts: 3,
        Action: "game_finalised",
        Participant1IsHome: true,
        Score: {
          Participant1: { Total: { Goals: 1 }, PE: { Goals: 2 } },
          Participant2: { Total: { Goals: 1 }, PE: { Goals: 4 } },
        },
      }),
    ];
    const out = mapScores("18176123", rows);
    const goals = out?.events.filter((e) => e.type === "goal") ?? [];
    expect(goals).toHaveLength(2);
    const away = goals.find((g) => g.team === "away");
    const home = goals.find((g) => g.team === "home");
    expect(away?.minute).toBe(45);
    expect(home?.minute).toBe(54);
  });

  it("returns_null_for_no_rows", () => {
    expect(mapScores("1", [])).toBeNull();
  });

  it("infers_missing_goal_events_from_score_totals", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Action: "kickoff",
        Participant1IsHome: true,
        Clock: { Running: true, Seconds: 1 },
      }),
      scoreRow({
        Ts: 2,
        Action: "attack_possession",
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 3 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 5280 },
      }),
      scoreRow({
        Ts: 3,
        Action: "goal",
        Participant: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 3 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 5280 },
      }),
      scoreRow({ Ts: 4, Action: "yellow_card", Participant: 2, Clock: { Running: true, Seconds: 4920 } }),
    ];
    const out = mapScores("1", rows);
    const goals = out?.events.filter((e) => e.type === "goal") ?? [];
    expect(out?.score).toEqual({ home: 3, away: 0 });
    expect(goals).toHaveLength(3);
    expect(goals.every((g) => g.team === "home")).toBe(true);
    expect(goals.every((g) => g.minute != null)).toBe(true);
  });

  it("ft_last_row_wins_over_mid_match_score_spike", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Action: "kickoff",
        Participant1IsHome: true,
        Clock: { Running: true, Seconds: 1 },
      }),
      scoreRow({
        Ts: 2,
        Action: "goal",
        Participant: 2,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 0 } }, Participant2: { Total: { Goals: 1 } } },
        Clock: { Running: true, Seconds: 3180 },
      }),
      scoreRow({
        Ts: 3,
        Action: "attack_possession",
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 1 } }, Participant2: { Total: { Goals: 2 } } },
        Clock: { Running: true, Seconds: 4020 },
      }),
      scoreRow({
        Ts: 4,
        Action: "goal",
        Participant: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 1 } }, Participant2: { Total: { Goals: 1 } } },
        Clock: { Running: true, Seconds: 4080 },
      }),
      scoreRow({
        Ts: 5,
        Action: "goal",
        Participant: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 2 } }, Participant2: { Total: { Goals: 1 } } },
        Clock: { Running: true, Seconds: 5640 },
      }),
      scoreRow({ Ts: 6, Action: "game_finalised", Participant1IsHome: true }),
    ];
    const out = mapScores("pt-hrv", rows);
    expect(out?.score).toEqual({ home: 2, away: 1 });
    const goals = out?.events.filter((e) => e.type === "goal") ?? [];
    expect(goals.filter((g) => g.team === "home")).toHaveLength(2);
    expect(goals.filter((g) => g.team === "away")).toHaveLength(1);
  });

  it("fills_minute_on_inferred_goal_without_clock", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Action: "kickoff",
        Participant1IsHome: true,
        Clock: { Running: true, Seconds: 1 },
      }),
      scoreRow({
        Ts: 2,
        Action: "attack_possession",
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 1 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 4560 },
      }),
      scoreRow({
        Ts: 3,
        Action: "goal",
        Participant: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 3 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 4560 },
      }),
      scoreRow({
        Ts: 4,
        Action: "goal",
        Participant: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 3 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 5280 },
      }),
    ];
    const out = mapScores("1", rows);
    const goals = out?.events.filter((e) => e.type === "goal") ?? [];
    expect(goals).toHaveLength(3);
    expect(goals[0]?.minute).toBe(76);
  });

  it("dedupes_duplicate_penalty_outcome_bursts", () => {
    const rows = [
      scoreRow({ Seq: 1, Action: "penalty_outcome", Participant: 1, Data: { Outcome: "Missed" } }),
      scoreRow({ Seq: 2, Action: "penalty_outcome", Participant: 1, Data: { Outcome: "Missed" } }),
      scoreRow({ Seq: 3, Action: "penalty_outcome", Participant: 2, Data: { Outcome: "Scored" } }),
      scoreRow({
        Seq: 4,
        Action: "penalty_outcome",
        Participant: 2,
        Data: { Outcome: "Scored", PlayerId: 99 },
      }),
    ];
    const out = dedupePenaltyOutcomes(rows);
    expect(out).toHaveLength(2);
    expect(out[0]?.Data?.Outcome).toBe("Missed");
    expect(out[1]?.Data?.PlayerId).toBe(99);
  });

  it("regulation_penalty_awarded_not_shootout_and_keeps_2_0", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Action: "kickoff",
        Participant1IsHome: true,
        Clock: { Running: true, Seconds: 3600 },
      }),
      scoreRow({
        Ts: 2,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 2 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 4500 },
      }),
      scoreRow({
        Ts: 3,
        Action: "penalty",
        Participant: 1,
        Participant1IsHome: true,
        Clock: { Running: true, Seconds: 4510 },
      }),
      scoreRow({
        Ts: 4,
        Participant1IsHome: true,
        Score: { Participant2: { Total: { Goals: 1 } } },
        Clock: { Running: true, Seconds: 4520 },
      }),
    ];
    const out = mapScores("fra-mar", rows);
    expect(out?.clock?.phase).not.toBe("PEN");
    expect(out?.score).toEqual({ home: 2, away: 0 });
    const shootout = (out?.events ?? []).filter(
      (e) => e.type === "penalty_goal" || e.type === "penalty_miss",
    );
    expect(shootout).toHaveLength(0);
    expect(isPenaltyShootoutContext(rows)).toBe(false);
  });

  it("regulation_penalty_scored_adds_goal_not_shootout_kick", () => {
    const rows = [
      scoreRow({
        Ts: 1,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 2 } }, Participant2: { Total: { Goals: 0 } } },
        Clock: { Running: true, Seconds: 4500 },
      }),
      scoreRow({
        Ts: 2,
        Action: "penalty",
        Participant: 1,
        Participant1IsHome: true,
        Clock: { Running: true, Seconds: 4510 },
      }),
      scoreRow({
        Ts: 3,
        Action: "penalty_outcome",
        Participant: 1,
        Participant1IsHome: true,
        Data: { Outcome: "Scored", PlayerId: 42 },
        Clock: { Running: true, Seconds: 4525 },
        Score: { Participant1: { Total: { Goals: 3 } }, Participant2: { Total: { Goals: 0 } } },
      }),
    ];
    const out = mapScores("fra-mar-pen", rows);
    expect(out?.clock?.phase).not.toBe("PEN");
    expect(out?.score).toEqual({ home: 3, away: 0 });
    const goals = out?.events.filter((e) => e.type === "goal") ?? [];
    expect(goals.some((g) => g.team === "home" && g.minute != null && g.minute <= 120)).toBe(true);
    expect(out?.events?.some((e) => e.type === "penalty_goal")).toBe(false);
  });

  it("maps_eight_deduped_penalty_kicks", () => {
    const bursts: TxlineScoreRow[] = [
      [1316, 1, "Missed"],
      [1317, 1, "Missed"],
      [1319, 2, "Scored"],
      [1320, 2, "Scored"],
      [1321, 2, "Scored", 101],
      [1324, 1, "Scored"],
      [1325, 1, "Scored"],
      [1326, 1, "Scored", 102],
      [1344, 1, "Missed"],
      [1345, 1, "Missed"],
      [1349, 2, "Scored", 103],
    ].flatMap(([seq, participant, outcome, playerId]) => [
      scoreRow({
        Seq: seq as number,
        Action: "penalty_outcome",
        Participant: participant as number,
        Participant1IsHome: true,
        Data: {
          Outcome: outcome as string,
          ...(playerId != null ? { PlayerId: playerId as number } : {}),
        },
      }),
    ]);
    const out = mapScores("pen-test", [
      ...bursts,
      scoreRow({
        Action: "game_finalised",
        Participant1IsHome: true,
        Score: {
          Participant1: { PE: { Goals: 2 }, Total: { Goals: 1 } },
          Participant2: { PE: { Goals: 4 }, Total: { Goals: 1 } },
        },
      }),
    ]);
    const pens = out?.events.filter((e) => e.type === "penalty_goal" || e.type === "penalty_miss") ?? [];
    expect(pens).toHaveLength(5);
    expect(out?.penScore).toEqual({ home: 2, away: 4 });
  });

  it("dedupes_substitution_stub_without_players_when_named_swap_exists", () => {
    const lineupBlock = [
      { lineups: [] },
      {
        lineups: [
          {
            fixturePlayerId: 10,
            player: { normativeId: 10, preferredName: "Rice, Declan" },
          },
          {
            fixturePlayerId: 11,
            player: { normativeId: 11, preferredName: "Saka, Bukayo" },
          },
        ],
      },
    ];
    const rows = [
      scoreRow({
        Ts: 99,
        Action: "lineups",
        Participant1IsHome: true,
        Lineups: lineupBlock,
      }),
      scoreRow({
        Ts: 100,
        Participant1IsHome: true,
        Participant: 2,
        Action: "substitution",
        Clock: { Seconds: 45 * 60 },
        Data: {},
      }),
      scoreRow({
        Ts: 101,
        Participant1IsHome: true,
        Participant: 2,
        Action: "substitution",
        Clock: { Seconds: 45 * 60 },
        Data: { PlayerOutId: 10, PlayerInId: 11 },
      }),
      scoreRow({
        Ts: 102,
        Participant1IsHome: true,
        Score: { Participant1: { Total: { Goals: 0 } }, Participant2: { Total: { Goals: 0 } } },
      }),
    ];
    const out = mapScores("sub-dedupe", rows);
    const subs = (out?.events ?? []).filter((e) => e.type.includes("substitution"));
    expect(subs).toHaveLength(1);
    expect(subs[0]?.player).toContain("Rice, Declan");
    expect(subs[0]?.player).toContain("Saka, Bukayo");
  });
});
