#!/usr/bin/env python3
"""Generate all TTS segments for the Natt Pundit pitch video using Gemini 3.1 Flash TTS."""
from __future__ import annotations

import base64
import os
import sys
import wave
from pathlib import Path

from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "02_generative" / "tts"

MODEL = os.environ.get("NATT_PILOT_TTS_MODEL", "gemini-3.1-flash-tts-preview")
VOICE = os.environ.get("NATT_PILOT_TTS_VOICE", "Charon")
SAMPLE_RATE = 24000

STYLE = (
    "[deep male voice] [slow pace] [low register] [authoritative] [netflix documentary]\n"
    "Speak like a premium Netflix tech documentary narrator: deep male baritone, "
    "calm authority, measured pacing, subtle gravitas. Lower pitch, no upspeak, "
    "no sales energy, no cheerfulness. British-leaning neutral English accent. "
    "Pause deliberately before the last sentence. Zero hype."
)

SEGMENTS = [
    {
        "id": "01_hook",
        "text": "The world watches every match. Here is how fans — and agents — settle the stakes."
    },
    {
        "id": "02_reveal",
        "text": "World Cup fixtures. Live odds. Setup — or hold. No noise."
    },
    {
        "id": "03_stakes",
        "text": "Pick your side. Stake devnet USDC. Shared pool. On-chain. One tap."
    },
    {
        "id": "04_reward",
        "text": "Track PnL. When the match settles — collect payout. Merkle proof. Verifiable."
    },
    {
        "id": "05_twist",
        "text": "While you bet as a fan — an autonomous agent bets on its own. Same escrow. Same rules. Proof on the dashboard."
    },
    {
        "id": "06_agents",
        "text": "Twenty MCP tools. Connect in one click. Wallet signs — agents never hold your keys."
    },
    {
        "id": "07_trust",
        "text": "Two hundred twenty tests. Security patch July tenth. Double-claim blocked: AlreadyClaimed."
    },
    {
        "id": "08_architecture",
        "text": "Mainnet data from TxLINE. Devnet escrow for the hackathon."
    },
    {
        "id": "09_close",
        "text": "Natt Settlement. Open source. TxODDS World Cup track. July nineteenth."
    }
]


def save_wav(pcm: bytes, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    api_key = os.environ.get("GOOGLE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    print(f"[tts] Starting batch generation with model={MODEL}, voice={VOICE}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for seg in SEGMENTS:
        seg_id = seg["id"]
        text = seg["text"]
        prompt = f"{STYLE}\n\nText:\n{text}"
        out_path = OUT_DIR / f"{seg_id}.wav"

        print(f"[tts] Generating {seg_id} -> '{text[:50]}...'")

        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=[{"parts": [{"text": prompt}]}],
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE)
                        )
                    ),
                ),
            )

            part = response.candidates[0].content.parts[0]
            raw = part.inline_data.data
            pcm = base64.b64decode(raw) if isinstance(raw, str) else raw

            save_wav(pcm, out_path)
            print(f"[tts] PASS -> {out_path} ({len(pcm)} bytes pcm)")

        except Exception as err:
            print(f"[tts] FAIL on {seg_id}: {err}", file=sys.stderr)
            return 1

    print("[tts] Batch generation completed successfully!")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as err:
        print(f"[tts] FATAL: {err}", file=sys.stderr)
        raise SystemExit(1)
