import bs58 from "bs58";
import type { Fixture } from "@natt-pundit/contracts";
import { PublicKey } from "@solana/web3.js";
import {
  getEscrowProgramId,
  vaultPda,
  type EscrowActivityView,
  type PoolSnapshot,
  type UserPositionView,
} from "@/lib/nattEscrow";
import {
  fixtureIdFromPoolBytes,
  parsePoolAccountBytes,
} from "@/lib/poolSnapshotParse";
import { parsePositionAccountBytes, sideNameFromIndex } from "@/lib/positionSnapshotParse";
import { serverEscrowConnection } from "@/lib/solanaServerRpc";
import {
  betRowFromActivity,
  summarizeWalletBets,
  type WalletBetRow,
  type WalletPortfolioSummary,
} from "@/lib/walletPortfolio";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { usdcMintAddress } from "@/lib/escrowCluster";

const USER_POSITION_DISCRIMINATOR = Buffer.from([251, 248, 209, 245, 83, 234, 17, 27]);

export type WalletOnChainBalances = {
  sol: number;
  usdc: number | null;
};

export async function fetchWalletOnChainBalances(walletAddress: string): Promise<WalletOnChainBalances> {
  const owner = new PublicKey(walletAddress);
  const connection = await serverEscrowConnection();
  const lamports = await connection.getBalance(owner);
  let usdc: number | null = null;
  try {
    const mint = new PublicKey(usdcMintAddress());
    const ata = getAssociatedTokenAddressSync(mint, owner);
    const bal = await connection.getTokenAccountBalance(ata);
    usdc = Number(bal.value.uiAmountString ?? 0);
  } catch {
    usdc = null;
  }
  return { sol: lamports / 1e9, usdc };
}

function gatewayBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TXLINE_GATEWAY_URL?.trim() ||
    process.env.TXLINE_GATEWAY_URL?.trim() ||
    "http://localhost:4001"
  );
}

function fallbackFixture(fixtureId: string, kickoffTs: number, settled: boolean): Fixture {
  const kickoffAt =
    kickoffTs > 0
      ? new Date(kickoffTs * 1000).toISOString()
      : new Date(0).toISOString();
  return {
    fixtureId,
    homeTeam: "—",
    awayTeam: "—",
    kickoffAt,
    status: settled ? "finished" : "scheduled",
    competition: "World Cup",
  };
}

async function resolveFixtureMeta(
  fixtureId: string,
  kickoffTs: number,
  settled: boolean,
): Promise<Fixture> {
  try {
    const res = await fetch(`${gatewayBaseUrl()}/v1/fixtures/${encodeURIComponent(fixtureId)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as Fixture;
    }
  } catch {
    /* fallback below */
  }
  return fallbackFixture(fixtureId, kickoffTs, settled);
}

function poolToSnapshot(parsed: ReturnType<typeof parsePoolAccountBytes>): PoolSnapshot {
  return {
    exists: parsed.exists,
    settled: parsed.settled,
    winningSide: parsed.winningSide,
    totalDeposited: parsed.totalDeposited,
    sideTotals: parsed.sideTotals,
    kickoffTs: parsed.kickoffTs,
  };
}

export async function scanWalletPortfolioOnChain(walletAddress: string): Promise<{
  bets: WalletBetRow[];
  summary: WalletPortfolioSummary;
}> {
  const programId = getEscrowProgramId();
  if (!programId) {
    return { bets: [], summary: summarizeWalletBets([]) };
  }

  const owner = new PublicKey(walletAddress);
  const connection = await serverEscrowConnection();
  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      { memcmp: { offset: 0, bytes: bs58.encode(USER_POSITION_DISCRIMINATOR) } },
      { memcmp: { offset: 8, bytes: owner.toBase58() } },
    ],
  });

  const rows: WalletBetRow[] = [];
  const fixtureCache = new Map<string, Fixture>();

  for (const { account } of accounts) {
    const posParsed = parsePositionAccountBytes(account.data);
    const side = sideNameFromIndex(posParsed.side);
    const amountUsdc = Number(posParsed.amount) / 1_000_000;
    if (!side || (amountUsdc <= 0 && !posParsed.claimed)) continue;

    const poolKey = new PublicKey(account.data.subarray(40, 72));
    const poolInfo = await connection.getAccountInfo(poolKey);
    if (!poolInfo?.data) continue;

    const poolParsed = parsePoolAccountBytes(poolInfo.data);
    const fixtureId = fixtureIdFromPoolBytes(poolInfo.data);
    if (!fixtureId) continue;

    let totalDeposited = poolParsed.totalDeposited;
    const sideSum =
      poolParsed.sideTotals[0] + poolParsed.sideTotals[1] + poolParsed.sideTotals[2];
    if (poolParsed.settled) {
      if (sideSum > BigInt(0)) {
        totalDeposited = sideSum;
      }
    } else {
      try {
        const vault = vaultPda(programId, fixtureId);
        const vb = await connection.getTokenAccountBalance(vault);
        totalDeposited = BigInt(vb.value.amount);
      } catch {
        /* keep pool account total */
      }
    }

    let fixture = fixtureCache.get(fixtureId);
    if (!fixture) {
      fixture = await resolveFixtureMeta(fixtureId, poolParsed.kickoffTs, poolParsed.settled);
      fixtureCache.set(fixtureId, fixture);
    }

    const position: UserPositionView = {
      exists: posParsed.exists || posParsed.claimed,
      side,
      amountUsdc,
      claimed: posParsed.claimed,
    };
    const activity: EscrowActivityView = {
      pool: poolToSnapshot({ ...poolParsed, totalDeposited }),
      participantCount: 0,
      yourPosition: position,
    };
    const row = betRowFromActivity(fixture, activity);
    if (row) rows.push(row);
  }

  rows.sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());
  return { bets: rows, summary: summarizeWalletBets(rows) };
}
