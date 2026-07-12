import type { NextApiRequest, NextApiResponse } from "next";
import bs58 from "bs58";
import { deriveEscrowPoolMode } from "@natt-pundit/natt-core";
import { PublicKey } from "@solana/web3.js";
import { getEscrowProgramId, poolPda, positionPda, vaultPda } from "@/lib/nattEscrow";
import { parsePoolAccountBytes, poolSnapshotToJson, type PoolSnapshotJson } from "@/lib/poolSnapshotParse";
import { parsePositionAccountBytes, sideNameFromIndex } from "@/lib/positionSnapshotParse";
import { serverEscrowConnection } from "@/lib/solanaServerRpc";

const USER_POSITION_DISCRIMINATOR = Buffer.from([251, 248, 209, 245, 83, 234, 17, 27]);

export type EscrowActivityJson = {
  pool: PoolSnapshotJson;
  poolMode: "unmatched" | "parimutuel";
  participantCount: number;
  wallet?: string;
  yourPosition?: {
    exists: boolean;
    side: string | null;
    amountUsdc: number;
    claimed: boolean;
    positionPda: string;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const fixtureId = typeof req.query.fixtureId === "string" ? req.query.fixtureId : "";
  const wallet = typeof req.query.wallet === "string" ? req.query.wallet.trim() : "";

  if (!fixtureId) {
    res.status(400).json({ error: "fixture_id_required" });
    return;
  }

  const programId = getEscrowProgramId();
  if (!programId) {
    res.status(503).json({ error: "escrow_program_not_configured" });
    return;
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const connection = await serverEscrowConnection();
  const poolKey = poolPda(programId, fixtureId);

  let poolParsed = {
    exists: false,
    settled: false,
    winningSide: 255,
    totalDeposited: BigInt(0),
    sideTotals: [BigInt(0), BigInt(0), BigInt(0)] as [bigint, bigint, bigint],
    kickoffTs: 0,
  };

  const poolInfo = await connection.getAccountInfo(poolKey);
  if (poolInfo?.data) {
    poolParsed = parsePoolAccountBytes(poolInfo.data);
    try {
      const vault = vaultPda(programId, fixtureId);
      const vb = await connection.getTokenAccountBalance(vault);
      poolParsed.totalDeposited = BigInt(vb.value.amount);
    } catch {
      /* keep pool account total */
    }
  }

  let participantCount = 0;
  if (poolParsed.exists) {
    try {
      const accounts = await connection.getProgramAccounts(programId, {
        filters: [
          { memcmp: { offset: 0, bytes: bs58.encode(USER_POSITION_DISCRIMINATOR) } },
          { memcmp: { offset: 40, bytes: poolKey.toBase58() } },
        ],
      });
      participantCount = accounts.filter((a) => {
        const pos = parsePositionAccountBytes(a.account.data);
        return pos.exists && pos.amount > BigInt(0) && !pos.claimed;
      }).length;
    } catch {
      participantCount = poolParsed.totalDeposited > BigInt(0) ? 1 : 0;
    }
  }

  const body: EscrowActivityJson = {
    pool: poolSnapshotToJson(poolParsed),
    poolMode: deriveEscrowPoolMode(poolParsed.sideTotals),
    participantCount,
  };

  if (wallet) {
    try {
      const owner = new PublicKey(wallet);
      const posKey = positionPda(programId, poolKey, owner);
      const posInfo = await connection.getAccountInfo(posKey);
      const pos = posInfo?.data
        ? parsePositionAccountBytes(posInfo.data)
        : { exists: false, side: null, amount: BigInt(0), claimed: false };
      body.wallet = wallet;
      body.yourPosition = {
        exists: pos.exists,
        side: sideNameFromIndex(pos.side),
        amountUsdc: Number(pos.amount) / 1_000_000,
        claimed: pos.claimed,
        positionPda: posKey.toBase58(),
      };
    } catch {
      body.wallet = wallet;
      body.yourPosition = {
        exists: false,
        side: null,
        amountUsdc: 0,
        claimed: false,
        positionPda: "",
      };
    }
  }

  res.status(200).json(body);
}
