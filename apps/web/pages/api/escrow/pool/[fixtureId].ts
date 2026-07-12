import type { NextApiRequest, NextApiResponse } from "next";
import { getEscrowProgramId, poolPda, vaultPda } from "@/lib/nattEscrow";
import { parsePoolAccountBytes, poolSnapshotToJson } from "@/lib/poolSnapshotParse";
import { serverEscrowConnection } from "@/lib/solanaServerRpc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const fixtureId = typeof req.query.fixtureId === "string" ? req.query.fixtureId : "";
  if (!fixtureId) {
    res.status(400).json({ error: "fixture_id_required" });
    return;
  }

  const programId = getEscrowProgramId();
  if (!programId) {
    res.status(503).json({ error: "escrow_program_not_configured" });
    return;
  }

  const connection = await serverEscrowConnection();
  const poolKey = poolPda(programId, fixtureId);
  const info = await connection.getAccountInfo(poolKey);

  if (!info?.data) {
    res.status(200).json(
      poolSnapshotToJson({
        exists: false,
        settled: false,
        winningSide: 255,
        totalDeposited: BigInt(0),
        sideTotals: [BigInt(0), BigInt(0), BigInt(0)],
        kickoffTs: 0,
      }),
    );
    return;
  }

  const parsed = parsePoolAccountBytes(info.data);
  try {
    const vault = vaultPda(programId, fixtureId);
    const vb = await connection.getTokenAccountBalance(vault);
    parsed.totalDeposited = BigInt(vb.value.amount);
  } catch {
    /* keep pool account total */
  }

  res.status(200).json(poolSnapshotToJson(parsed));
}
