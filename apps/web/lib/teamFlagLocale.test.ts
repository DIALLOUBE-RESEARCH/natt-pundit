import { describe, expect, it } from "vitest";
import { canonicalTeamKey } from "./teamI18n";
import { teamFlagIso } from "./countryFlags";

describe("team flag locale", () => {
  it("canonicalTeamKey resolves French display labels", () => {
    expect(canonicalTeamKey("Espagne")).toBe("spain");
    expect(canonicalTeamKey("Allemagne")).toBe("germany");
    expect(canonicalTeamKey("France")).toBe("france");
  });

  it("teamFlagIso works on canonical keys from localized labels", () => {
    expect(teamFlagIso("spain")).toBe("es");
    expect(teamFlagIso(canonicalTeamKey("Espagne") ?? "")).toBe("es");
  });
});
