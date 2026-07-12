import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSessionClient,
  clientKeyFromRequest,
  isSessionBindEnabled,
  registerSessionClient,
} from "../mcp-session-bind.mjs";

describe("mcp-session-bind defaults", () => {
  it("F91N: session bind disabled by default (Claude web remote MCP)", () => {
    assert.equal(isSessionBindEnabled({}), false);
    assert.equal(isSessionBindEnabled({ PUNDIT_MCP_SESSION_BIND_ENABLED: "" }), false);
    assert.equal(isSessionBindEnabled({ PUNDIT_MCP_SESSION_BIND_ENABLED: "true" }), true);
  });
});

describe("mcp-session-bind", () => {
  it("clientKeyFromRequest is stable for same ip/ua", () => {
    const a = clientKeyFromRequest({ ip: "1.2.3.4", userAgent: "curl/8.0" });
    const b = clientKeyFromRequest({ ip: "1.2.3.4", userAgent: "curl/8.0" });
    assert.equal(a, b);
    assert.equal(a.length, 64);
  });

  it("clientKey differs when ua changes", () => {
    const a = clientKeyFromRequest({ ip: "1.2.3.4", userAgent: "curl/8.0" });
    const b = clientKeyFromRequest({ ip: "1.2.3.4", userAgent: "python/3.12" });
    assert.notEqual(a, b);
  });

  it("PROP-3: assertSessionClient rejects mismatch", () => {
    const store = new Map();
    const sessionId = "sess-1";
    const keyA = clientKeyFromRequest({ ip: "10.0.0.1", userAgent: "agent-a" });
    const keyB = clientKeyFromRequest({ ip: "10.0.0.2", userAgent: "agent-b" });
    registerSessionClient(store, sessionId, keyA);
    assert.equal(assertSessionClient(store, sessionId, keyA), true);
    assert.equal(assertSessionClient(store, sessionId, keyB), false);
  });

  it("unknown sessionId passes assert (initialize path)", () => {
    const store = new Map();
    assert.equal(assertSessionClient(store, "new-session", "any"), true);
  });
});
