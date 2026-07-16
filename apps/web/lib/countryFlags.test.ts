import { describe, expect, it } from "vitest";
import {
  isAllowedFlagIso,
  normalizeFlagWidth,
  teamFlagImageSources,
  teamFlagProxyUrl,
} from "./countryFlags";

describe("countryFlags", () => {
  it("normalizeFlagWidth snaps to flagcdn sizes", () => {
    expect(normalizeFlagWidth(44)).toBe(80);
    expect(normalizeFlagWidth(160)).toBe(160);
    expect(normalizeFlagWidth(999)).toBe(160);
  });

  it("teamFlagProxyUrl uses same-origin API", () => {
    const url = teamFlagProxyUrl("France", 80);
    expect(url).toContain("/api/flags/fr?w=80");
  });

  it("teamFlagImageSources prefers proxy before external CDN", () => {
    const sources = teamFlagImageSources("Spain", { circle: true, size: "sm" });
    expect(sources[0]).toContain("/api/flags/es");
    expect(sources.some((s) => s.includes("flagcdn.com"))).toBe(true);
  });

  it("isAllowedFlagIso rejects unknown codes", () => {
    expect(isAllowedFlagIso("fr")).toBe(true);
    expect(isAllowedFlagIso("xx")).toBe(false);
  });
});
