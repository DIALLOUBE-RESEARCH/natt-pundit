import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLAUDE_WEB_CONNECTOR_HINTS } from "../mcp-agent-instructions.mjs";

describe("mcp-agent-instructions F91N", () => {
  it("claude web hints declare no OAuth", () => {
    assert.equal(CLAUDE_WEB_CONNECTOR_HINTS.oauth_required, false);
    assert.ok(CLAUDE_WEB_CONNECTOR_HINTS.setup_steps.length >= 3);
    assert.match(CLAUDE_WEB_CONNECTOR_HINTS.connector_url, /^https:\/\//);
  });
});
