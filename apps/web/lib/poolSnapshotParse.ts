export type PoolSnapshotParsed = {
  exists: boolean;
  settled: boolean;
  winningSide: number;
  totalDeposited: bigint;
  sideTotals: [bigint, bigint, bigint];
  kickoffTs: number;
};

/** Copy bytes so DataView never reads the wrong slice of a shared ArrayBuffer. */
function toOwnedBytes(data: Uint8Array): Uint8Array {
  if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
    return data;
  }
  return new Uint8Array(data);
}

export function parsePoolAccountBytes(data: Uint8Array): PoolSnapshotParsed {
  const bytes = toOwnedBytes(data);
  if (bytes.length < 92) {
    return {
      exists: true,
      settled: false,
      winningSide: 255,
      totalDeposited: BigInt(0),
      sideTotals: [BigInt(0), BigInt(0), BigInt(0)],
      kickoffTs: 0,
    };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    exists: true,
    settled: bytes[56] !== 0,
    winningSide: bytes[57],
    totalDeposited: view.getBigUint64(58, true),
    sideTotals: [
      view.getBigUint64(66, true),
      view.getBigUint64(74, true),
      view.getBigUint64(82, true),
    ],
    kickoffTs: Number(view.getBigInt64(48, true)),
  };
}

export type PoolSnapshotJson = {
  exists: boolean;
  settled: boolean;
  winningSide: number;
  totalDeposited: string;
  sideTotals: [string, string, string];
  kickoffTs: number;
};

export function poolSnapshotToJson(s: PoolSnapshotParsed): PoolSnapshotJson {
  return {
    exists: s.exists,
    settled: s.settled,
    winningSide: s.winningSide,
    totalDeposited: s.totalDeposited.toString(),
    sideTotals: [
      s.sideTotals[0].toString(),
      s.sideTotals[1].toString(),
      s.sideTotals[2].toString(),
    ],
    kickoffTs: s.kickoffTs,
  };
}

export function poolSnapshotFromJson(j: PoolSnapshotJson): PoolSnapshotParsed {
  return {
    exists: j.exists,
    settled: j.settled,
    winningSide: j.winningSide,
    totalDeposited: BigInt(j.totalDeposited),
    sideTotals: [BigInt(j.sideTotals[0]), BigInt(j.sideTotals[1]), BigInt(j.sideTotals[2])],
    kickoffTs: j.kickoffTs,
  };
}

/** Anchor Pool.fixture_id (u64 LE) at byte offset 40 after discriminator + authority. */
export function fixtureIdFromPoolBytes(data: Uint8Array): string | null {
  if (!data || data.length < 48) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return view.getBigUint64(40, true).toString();
}
