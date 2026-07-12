import { describe, expect, it } from "vitest";
import {
  countdownTickMs,
  formatCountdownDigits,
  parseKickoffMs,
  splitCountdownParts,
} from "./kickoffCountdown";

describe("kickoffCountdown", () => {
  it("parses ISO kickoff", () => {
    const ms = parseKickoffMs("2026-07-03T18:00:00.000Z");
    expect(ms).toBe(Date.parse("2026-07-03T18:00:00.000Z"));
  });

  it("formats days when >= 24h remaining", () => {
    const kickoff = Date.parse("2026-07-05T12:00:00.000Z");
    const now = Date.parse("2026-07-03T12:00:00.000Z");
    const parts = splitCountdownParts(kickoff, now);
    expect(parts).not.toBeNull();
    expect(formatCountdownDigits(parts!)).toBe("02:00:00:00");
  });

  it("formats HH:MM:SS under 24h", () => {
    const kickoff = Date.parse("2026-07-03T13:05:07.000Z");
    const now = Date.parse("2026-07-03T12:00:00.000Z");
    const parts = splitCountdownParts(kickoff, now);
    expect(formatCountdownDigits(parts!)).toBe("01:05:07");
  });

  it("returns null when kickoff passed", () => {
    expect(splitCountdownParts(1000, 2000)).toBeNull();
  });

  it("ticks every second (live countdown)", () => {
    const parts = splitCountdownParts(3_700_000, 3_600_000);
    expect(countdownTickMs(parts)).toBe(1000);
    const far = splitCountdownParts(Date.parse("2026-07-05T12:00:00.000Z"), Date.parse("2026-07-03T12:00:00.000Z"));
    expect(countdownTickMs(far)).toBe(1000);
  });
});
