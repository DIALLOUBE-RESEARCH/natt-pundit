import { describe, expect, it } from "vitest";
import { fixtureIdFromPoolBytes } from "./poolSnapshotParse";

describe("fixtureIdFromPoolBytes", () => {
  it("reads u64 fixture id at offset 40", () => {
    const buf = Buffer.alloc(92);
    buf.writeBigUInt64LE(BigInt(18187298), 40);
    expect(fixtureIdFromPoolBytes(buf)).toBe("18187298");
  });

  it("returns null for short buffers", () => {
    expect(fixtureIdFromPoolBytes(Buffer.alloc(16))).toBeNull();
  });
});
