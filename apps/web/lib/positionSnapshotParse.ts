export type UserPositionSnapshot = {
  exists: boolean;
  side: number | null;
  amount: bigint;
  claimed: boolean;
};

const SIDE_NAMES = ["home", "draw", "away"] as const;

export function sideNameFromIndex(side: number | null): (typeof SIDE_NAMES)[number] | null {
  if (side === null || side > 2) return null;
  return SIDE_NAMES[side];
}

/** Anchor UserPosition layout (natt_escrow). */
export function parsePositionAccountBytes(data: Uint8Array): UserPositionSnapshot {
  if (!data || data.length < 82) {
    return { exists: false, side: null, amount: BigInt(0), claimed: false };
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const side = data[72];
  const amount = view.getBigUint64(73, true);
  const claimed = data[81] !== 0;
  if (amount === BigInt(0) && side > 2) {
    return { exists: false, side: null, amount: BigInt(0), claimed: false };
  }
  return {
    exists: amount > BigInt(0),
    side: side <= 2 ? side : null,
    amount,
    claimed,
  };
}

export function usdcFromBase(amount: bigint): number {
  return Number(amount) / 1_000_000;
}
