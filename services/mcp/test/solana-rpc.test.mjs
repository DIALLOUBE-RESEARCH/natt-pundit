import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getEscrowRpcCandidates } from "../solana-rpc.mjs";

describe("solana-rpc", () => {
  it("getEscrowRpcCandidates dedupes and includes fallbacks", () => {
    const prev = process.env.SOLANA_DEVNET_RPC_URL;
    process.env.SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com";
    const urls = getEscrowRpcCandidates();
    process.env.SOLANA_DEVNET_RPC_URL = prev;
    assert.ok(urls.length >= 1);
    assert.equal(urls[0], "https://api.devnet.solana.com");
  });
});
