import { serve } from "@hono/node-server";
import type { Fixture, ScoresSnapshot } from "@natt-pundit/contracts";
import { ScoresSnapshotSchema } from "@natt-pundit/contracts";
import type { CommentaryLang } from "@natt-pundit/natt-core";
import { isCommentaryLang } from "@natt-pundit/natt-core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  detectMomentDrafts,
  draftToMoment,
  getReadyMoments,
  markInFlight,
  storeMoment,
  markMomentDraftSeen,
} from "./detectMoments.js";
import { synthesizeSpeech } from "./googleTts.js";

const app = new Hono();
const gatewayUrl = process.env.TXLINE_GATEWAY_URL ?? "http://localhost:4001";
const webOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const enabled = (process.env.NATT_COMMENTARY_ENABLED ?? "false").toLowerCase() === "true";

app.use(
  "*",
  cors({
    origin: webOrigin,
    allowMethods: ["GET", "OPTIONS"],
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "commentary-service",
    enabled,
    ttsKey: Boolean(
      process.env.GOOGLE_CLOUD_TTS_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim(),
    ),
  }),
);

let fixturesCache: { at: number; list: Fixture[] } | null = null;
const FIXTURES_TTL_MS = 60_000;

async function fetchFixtures(): Promise<Fixture[]> {
  const now = Date.now();
  if (fixturesCache && now - fixturesCache.at < FIXTURES_TTL_MS) {
    return fixturesCache.list;
  }
  const res = await fetch(`${gatewayUrl}/v1/fixtures`);
  if (!res.ok) return fixturesCache?.list ?? [];
  const data = (await res.json()) as { fixtures?: Fixture[] };
  const list = data.fixtures ?? [];
  fixturesCache = { at: now, list };
  return list;
}

async function fetchScores(fixtureId: string): Promise<ScoresSnapshot | null> {
  const res = await fetch(`${gatewayUrl}/v1/fixtures/${fixtureId}/scores`);
  if (!res.ok) return null;
  return ScoresSnapshotSchema.parse(await res.json());
}

async function processDrafts(
  fixtureId: string,
  scores: ScoresSnapshot,
  homeTeam: string,
  awayTeam: string,
  lang: CommentaryLang,
): Promise<void> {
  const drafts = detectMomentDrafts(fixtureId, scores, homeTeam, awayTeam);
  for (const draft of drafts) {
    if (!markInFlight(draft.momentId, lang)) continue;
    const text = draftToMoment(draft, fixtureId, lang, "").text;
    try {
      const { audioBase64 } = await synthesizeSpeech(text, lang, draft.momentId);
      storeMoment(draftToMoment(draft, fixtureId, lang, audioBase64));
      markMomentDraftSeen(fixtureId, draft);
    } catch (err) {
      console.error("[commentary] tts_failed", draft.momentId, err);
      storeMoment(draftToMoment(draft, fixtureId, lang, ""));
      markMomentDraftSeen(fixtureId, draft);
    }
  }
}

function parseLang(raw: string | undefined) {
  if (raw && isCommentaryLang(raw)) return raw;
  return "en" as const;
}

app.get("/v1/commentary/:fixtureId/moments", async (c) => {
  if (!enabled) {
    return c.json({ enabled: false, moments: [] });
  }

  const fixtureId = c.req.param("fixtureId");
  const lang = parseLang(c.req.query("lang"));
  const excludeRaw = c.req.query("exclude") ?? "";
  const exclude = new Set(
    excludeRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const scores = await fetchScores(fixtureId);
  if (!scores) {
    return c.json({ enabled: true, moments: [], error: "scores_unavailable" });
  }

  const fixtures = await fetchFixtures();
  const fx = fixtures.find((f) => f.fixtureId === fixtureId);
  const homeTeam = fx?.homeTeam ?? "Home";
  const awayTeam = fx?.awayTeam ?? "Away";

  await processDrafts(fixtureId, scores, homeTeam, awayTeam, lang);

  const moments = getReadyMoments(fixtureId, lang, exclude);
  return c.json({ enabled: true, moments });
});

const port = Number(process.env.PORT ?? 4003);
console.log(`[commentary-service] port=${port} enabled=${enabled}`);
serve({ fetch: app.fetch, port });
