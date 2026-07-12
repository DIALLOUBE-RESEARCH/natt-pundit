import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  consumeIntroFree,
  isDevnetOpenAccess,
} from "../intro-free.mjs";

describe("intro-free", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    delete process.env.PUNDIT_X402_DEVNET_OPEN_ACCESS;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("isDevnetOpenAccess true when env set", () => {
    process.env.PUNDIT_X402_DEVNET_OPEN_ACCESS = "true";
    assert.equal(isDevnetOpenAccess(), true);
  });

  it("isDevnetOpenAccess false by default", () => {
    assert.equal(isDevnetOpenAccess(), false);
  });

  it("consumeIntroFree grants once per tool/wallet/day", () => {
    assert.equal(consumeIntroFree("get_edge_summary", "walletA"), true);
    assert.equal(consumeIntroFree("get_edge_summary", "walletA"), false);
    assert.equal(consumeIntroFree("get_match_odds", "walletA"), true);
  });
});
