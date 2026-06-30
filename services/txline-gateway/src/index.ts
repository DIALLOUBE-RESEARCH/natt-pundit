import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  FixturesListSchema,
  ScoresSnapshotSchema,
  activateApiToken,
  BuildSubscribeSchema,
  getFixtureOdds,
  getFixtureOddsDebug,
  getFixtureScores,
  guestJwt,
  listFixtures,
  useMock,
} from "./txline.js";
import { getFixtureProof, verifyFixtureProof } from "./txlineProof.js";

const app = new Hono();

const webOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: webOrigin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "txline-gateway",
    mock: useMock(),
    hasToken: Boolean(process.env.TXLINE_API_TOKEN),
  }),
);

app.get("/v1/fixtures", async (c) => {
  try {
    const payload = await listFixtures();
    return c.json(FixturesListSchema.parse(payload));
  } catch (err) {
    return c.json(
      {
        error: "fixtures_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      502,
    );
  }
});

app.get("/v1/fixtures/:id/odds", async (c) => {
  try {
    const fixtureId = c.req.param("id");
    const odds = await getFixtureOdds(fixtureId);
    return c.json({ odds, fixtureId });
  } catch (err) {
    return c.json(
      {
        error: "odds_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      502,
    );
  }
});

/** DEV-only raw odds shape when ODDS_DEBUG=true */
app.get("/v1/fixtures/:id/odds/debug", async (c) => {
  if (process.env.ODDS_DEBUG !== "true") {
    return c.json({ error: "disabled" }, 404);
  }
  try {
    const fixtureId = c.req.param("id");
    const debug = await getFixtureOddsDebug(fixtureId);
    return c.json(debug);
  } catch (err) {
    return c.json(
      {
        error: "odds_debug_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      502,
    );
  }
});

app.get("/v1/fixtures/:id/proof", async (c) => {
  const fixtureId = c.req.param("id");
  try {
    const proof = await getFixtureProof(fixtureId);
    return c.json(proof);
  } catch (err) {
    return c.json(
      {
        error: "proof_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      502,
    );
  }
});

app.get("/v1/fixtures/:id/proof/verify", async (c) => {
  const fixtureId = c.req.param("id");
  const result = await verifyFixtureProof(fixtureId);
  return c.json({ valid: result.valid, reason: result.reason });
});

app.get("/v1/fixtures/:id/scores", async (c) => {
  try {
    const scores = await getFixtureScores(c.req.param("id"));
    if (!scores) {
      return c.json({ error: "fixture_not_found" }, 404);
    }
    return c.json(ScoresSnapshotSchema.parse(scores));
  } catch (err) {
    return c.json(
      {
        error: "scores_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      502,
    );
  }
});

/** Proxy guest JWT — browser must not hold secrets. */
app.post("/v1/txline/guest", async (c) => {
  try {
    const token = await guestJwt();
    return c.json({ token });
  } catch (err) {
    return c.json(
      { error: "guest_failed", message: err instanceof Error ? err.message : "unknown" },
      502,
    );
  }
});

const ActivateSchema = z.object({
  txSig: z.string().min(1),
  walletSignature: z.string().min(1),
  leagues: z.array(z.number()).default([]),
  guestJwt: z.string().min(1),
});

app.post("/v1/txline/activate", zValidator("json", ActivateSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const result = await activateApiToken(body);
    return c.json({ token: result });
  } catch (err) {
    return c.json(
      { error: "activate_failed", message: err instanceof Error ? err.message : "unknown" },
      502,
    );
  }
});

/** Proxy Solana JSON-RPC — browser cannot call api.mainnet-beta (403/CORS). */
app.post("/v1/solana/rpc", async (c) => {
  const rpcUrl =
    process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";
  try {
    const body = await c.req.text();
    const upstream = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return c.json(
      {
        error: "solana_rpc_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      502,
    );
  }
});

/** Returns chain params for client-side subscribe tx (wallet signs in browser). */
app.post(
  "/v1/txline/subscribe-params",
  zValidator("json", BuildSubscribeSchema),
  async (c) => {
    const body = c.req.valid("json");
    return c.json({
      programId: "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA",
      tokenMint: "Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL",
      rpcUrl: process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com",
      serviceLevelId: body.serviceLevelId,
      durationWeeks: body.durationWeeks,
      selectedLeagues: [] as number[],
      walletPubkey: body.walletPubkey,
      docs: "https://txline.txodds.com/documentation/worldcup",
    });
  },
);

const port = Number(process.env.PORT ?? 4001);
console.log(`txline-gateway on :${port} mock=${useMock()}`);
serve({ fetch: app.fetch, port });
