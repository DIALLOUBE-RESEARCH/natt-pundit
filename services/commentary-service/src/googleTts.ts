import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CommentaryLang } from "@natt-pundit/natt-core";
import { VOICE_BY_LANG } from "./voices.js";

const CACHE_DIR = process.env.TTS_CACHE_DIR ?? "/data/tts-cache";

function apiKey(): string | null {
  return (
    process.env.GOOGLE_CLOUD_TTS_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    null
  );
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

function cachePath(momentId: string, lang: CommentaryLang): string {
  const safe = momentId.replace(/[^a-zA-Z0-9:_-]/g, "_");
  return join(CACHE_DIR, `${safe}_${lang}.mp3`);
}

export async function synthesizeSpeech(
  text: string,
  lang: CommentaryLang,
  momentId: string,
): Promise<{ audioBase64: string; fromCache: boolean }> {
  await ensureCacheDir();
  const path = cachePath(momentId, lang);
  try {
    const cached = await readFile(path);
    return { audioBase64: cached.toString("base64"), fromCache: true };
  } catch {
    /* miss */
  }

  const key = apiKey();
  if (!key) {
    throw new Error("tts_key_missing");
  }

  const voice = VOICE_BY_LANG[lang];
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.05, pitch: 0 },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`tts_failed:${res.status}:${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error("tts_empty");
  }

  const buf = Buffer.from(data.audioContent, "base64");
  await writeFile(path, buf);
  return { audioBase64: data.audioContent, fromCache: false };
}
