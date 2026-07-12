import { describe, expect, it } from "vitest";
import { validateSolanaRpcRequest } from "./solana_rpc_guard.js";

describe("solana_rpc_guard", () => {
  it("allows getLatestBlockhash", () => {
    const r = validateSolanaRpcRequest(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestBlockhash", params: [] }),
    );
    expect(r.ok).toBe(true);
  });

  it("denies requestAirdrop", () => {
    const r = validateSolanaRpcRequest(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "requestAirdrop",
        params: ["Eygd1V74pe9wNzsApnfWhFF1L9SMtBsLCGPNc17m834f", 1e9],
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toMatch(/blocked_method/);
  });

  it("allows simulateTransaction (escrow preflight)", () => {
    const r = validateSolanaRpcRequest(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: ["AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==", { encoding: "base64" }],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("denies unknown heavy method", () => {
    const r = validateSolanaRpcRequest(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getProgramAccounts", params: [] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toMatch(/denied_method/);
  });
});
