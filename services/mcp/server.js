const express = require("express");

const app = express();
app.use(express.json());

const MCP_PORT = parseInt(process.env.MCP_PORT || "4012", 10);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "natt-pundit-mcp", port: MCP_PORT });
});

(async () => {
  const { mountMcpPunditRoutes } = await import("./mcp-pundit-server.mjs");
  const { warmEscrowRpc } = await import("./solana-rpc.mjs");
  mountMcpPunditRoutes(app);

  warmEscrowRpc().catch((err) => {
    console.warn("[escrow-rpc] warm failed (will retry on first escrow call):", err.message);
  });

  app.listen(MCP_PORT, "0.0.0.0", () => {
    console.log(`[natt-pundit-mcp] listening on :${MCP_PORT}`);
  });
})().catch((err) => {
  console.error("[natt-pundit-mcp] boot failed:", err);
  process.exit(1);
});
