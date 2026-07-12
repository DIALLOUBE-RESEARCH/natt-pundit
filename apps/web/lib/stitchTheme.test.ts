import { describe, expect, it } from "vitest";
import {
  getStitchAppKitThemeMode,
  getStitchAppKitThemeVariables,
  normalizeStitchTheme,
  STITCH_THEME_STORAGE_KEY,
} from "@/shared/theme/stitchTheme";

describe("stitchTheme", () => {
  it("normalizes theme values", () => {
    expect(normalizeStitchTheme("dark")).toBe("dark");
    expect(normalizeStitchTheme("light")).toBe("light");
    expect(normalizeStitchTheme("invalid")).toBe("light");
    expect(normalizeStitchTheme(null)).toBe("light");
  });

  it("defaults appkit theme to light without storage", () => {
    expect(getStitchAppKitThemeMode()).toBe("light");
    expect(getStitchAppKitThemeVariables()["--w3m-accent"]).toBe("#C8A951");
  });

  it("exposes storage key", () => {
    expect(STITCH_THEME_STORAGE_KEY).toBe("natt-pundit-stitch-theme");
  });
});
