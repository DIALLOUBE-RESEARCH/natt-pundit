import { describe, expect, it } from "vitest";
import { FixtureCard } from "./FixtureCard";

describe("FixtureCard", () => {
  it("exports canonical component", () => {
    expect(FixtureCard).toBeTypeOf("function");
  });
});
