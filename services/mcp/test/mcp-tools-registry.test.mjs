import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PUNDIT_TOOL_NAMES } from "../mcp-pundit-server.mjs";

describe("mcp-pundit tools registry", () => {
  it("PUNDIT_TOOL_NAMES has 20 unique entries", () => {
    assert.equal(PUNDIT_TOOL_NAMES.length, 20);
    assert.equal(new Set(PUNDIT_TOOL_NAMES).size, 20);
  });

  it("includes F92N Data Lab tools", () => {
    for (const name of ["get_clv_verdict", "get_data_lab_index"]) {
      assert.ok(PUNDIT_TOOL_NAMES.includes(name), `missing ${name}`);
    }
  });

  it("includes F73N agent autonomy tools", () => {
    for (const name of ["get_fixture_agent_status", "submit_signed_escrow_tx"]) {
      assert.ok(PUNDIT_TOOL_NAMES.includes(name), `missing ${name}`);
    }
  });

  it("includes escrow agent tools", () => {
    for (const name of [
      "build_escrow_deposit_tx",
      "build_escrow_settle_tx",
      "build_escrow_claim_tx",
      "build_escrow_refund_tx",
      "build_escrow_refund_all_tx",
    ]) {
      assert.ok(PUNDIT_TOOL_NAMES.includes(name), `missing ${name}`);
    }
  });
});
