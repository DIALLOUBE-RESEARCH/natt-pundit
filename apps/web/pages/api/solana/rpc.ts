import type { NextApiRequest, NextApiResponse } from "next";
import { SOLANA_DEVNET_RPC } from "@/lib/escrowCluster";
import { postSolanaRpc } from "@/lib/solanaRpcProxy";
import {
  SlidingWindowRateLimiter,
  clientIpFromHeaders,
  isSolanaRpcProxyEnabled,
  validateSolanaRpcRequest,
} from "@natt-pundit/natt-core";

/** F95N — per-IP budget on the public RPC relay (sendTransaction is the hot path). */
const RPC_RATE_LIMIT_PER_MIN = Math.max(
  1,
  Number(process.env.NATT_RPC_RATE_LIMIT_PER_MIN) || 60,
);
const rateLimiter = new SlidingWindowRateLimiter(RPC_RATE_LIMIT_PER_MIN, 60_000);

export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!isSolanaRpcProxyEnabled()) {
    res.status(503).json({ error: "proxy_disabled" });
    return;
  }

  const ip = clientIpFromHeaders(req.headers["x-forwarded-for"], req.socket.remoteAddress);
  const decision = rateLimiter.check(ip);
  if (!decision.allowed) {
    res
      .status(429)
      .setHeader("Retry-After", String(decision.retryAfterSec))
      .json({ error: "rate_limited" });
    return;
  }

  const cluster = typeof req.query.cluster === "string" ? req.query.cluster : "";
  const rpcUrl =
    cluster === "devnet"
      ? process.env.SOLANA_DEVNET_RPC_URL?.trim() || SOLANA_DEVNET_RPC
      : process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";
  const body = await readRawBody(req);
  if (!body.trim()) {
    res.status(400).json({ error: "empty_body" });
    return;
  }

  const guard = validateSolanaRpcRequest(body);
  if (!guard.ok) {
    res.status(guard.status).json({ error: guard.code });
    return;
  }

  try {
    const upstream = await postSolanaRpc(rpcUrl, body);
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: "solana_rpc_failed",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
