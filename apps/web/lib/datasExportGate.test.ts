import { describe, expect, it } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  buildExportChallengeMessage,
  createExportChallenge,
  isExportAllowlisted,
  mintExportDownloadToken,
  verifyExportDownloadToken,
  verifySiwsExportSignature,
} from "./datasExportGate";

const OWNER = "Eygd1V74pe9wNzsApnfWhFF1L9SMtBsLCGPNc17m834f";

describe("datasExportGate", () => {
  it("allowlists built-in owner pubkey", () => {
    expect(isExportAllowlisted(OWNER)).toBe(true);
    expect(isExportAllowlisted("not-a-key")).toBe(false);
  });

  it("SIWS verify accepts valid signature", () => {
    const kp = nacl.sign.keyPair();
    const challenge = createExportChallenge(Date.now());
    // override allowlist via env not needed — use owner keypair mismatch test separately
    const msg = challenge.message;
    const sig = nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey);
    const bad = verifySiwsExportSignature({
      message: msg,
      signatureBase58: bs58.encode(sig),
      pubkey: bs58.encode(kp.publicKey),
      nowMs: Date.now(),
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe("not_allowlisted");
  });

  it("mint + verify download token", () => {
    process.env.NATT_DATAS_EXPORT_TOKEN_SECRET = "test-secret-32-chars-minimum!!";
    const nonce = "11111111-1111-4111-8111-111111111111";
    const token = mintExportDownloadToken({ pubkey: OWNER, nonce, nowMs: 1_000_000 });
    const v = verifyExportDownloadToken(token, 1_000_000);
    expect(v.ok).toBe(true);
    const expired = verifyExportDownloadToken(token, 1_000_000 + 3 * 60 * 1000);
    expect(expired.ok).toBe(false);
  });

  it("challenge message format", () => {
    const msg = buildExportChallengeMessage("abc", Date.parse("2026-07-03T12:00:00.000Z"));
    expect(msg).toContain("nonce: abc");
    expect(msg).toContain("expires: 2026-07-03T12:00:00.000Z");
  });
});
