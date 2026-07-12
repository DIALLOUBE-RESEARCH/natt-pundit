#!/usr/bin/env node
/**
 * Local JSON-RPC proxy -> api.devnet.solana.com with TLS verify disabled (cert expired).
 * Used by solana-cli inside Docker during program upgrade.
 */
import http from "node:http";
import https from "node:https";

const PORT = Number(process.env.DEVNET_PROXY_PORT || 18899);
const TARGET = new URL(process.env.SOLANA_DEVNET_RPC_URL?.trim() || "https://api.devnet.solana.com");
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function upstreamPost(body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      TARGET,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        agent: insecureAgent,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 502,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("POST only");
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  try {
    const upstream = await upstreamPost(body);
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    res.end(upstream.body);
  } catch (err) {
    res.writeHead(502);
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[devnet-rpc-proxy] ${TARGET.href} -> http://127.0.0.1:${PORT}`);
});
