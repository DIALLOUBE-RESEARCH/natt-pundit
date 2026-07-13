import { createServer } from "node:http";
import { gatewayUrl, keeperEnabled, keeperPort, pollIntervalMs } from "./config.mjs";
import { loadKeeperKeypair } from "./keypair.mjs";
import { runKeeperTick } from "./loop.mjs";

const state = {
  enabled: keeperEnabled(),
  lastTick: null,
  running: false,
};

async function tick() {
  if (!state.enabled || state.running) return;
  state.running = true;
  try {
    const signerKeypair = loadKeeperKeypair();
    const result = await runKeeperTick({
      gateway: gatewayUrl(),
      signerKeypair,
      log: (msg, extra) => console.log(`[escrow-keeper] ${msg}`, extra ?? ""),
    });
    state.lastTick = { at: new Date().toISOString(), ...result };
    console.log("[escrow-keeper] tick_done", result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "tick_failed";
    console.error("[escrow-keeper] tick_failed", message);
    state.lastTick = { at: new Date().toISOString(), error: message };
  } finally {
    state.running = false;
  }
}

const server = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/health/") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "escrow-keeper",
        enabled: state.enabled,
        gateway: gatewayUrl(),
        pollMs: pollIntervalMs(),
        lastTick: state.lastTick,
      }),
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(keeperPort(), () => {
  console.log(`[escrow-keeper] listening on :${keeperPort()} enabled=${state.enabled}`);
  if (state.enabled) {
    void tick();
    setInterval(() => void tick(), pollIntervalMs());
  } else {
    console.log("[escrow-keeper] NATT_PUNDIT_ESCROW_KEEPER_ENABLED=false — health only");
  }
});
