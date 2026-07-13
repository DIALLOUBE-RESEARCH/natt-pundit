#!/usr/bin/env python3
"""Pilot VO — Gemini 3.1 Flash TTS for beat 0:20-0:40."""
from __future__ import annotations

import base64
import os
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path

from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "01_scripts" / "pilot_00-40_vo.txt"
OUT_DIR = ROOT / "02_generative" / "tts"

MODEL = os.environ.get("NATT_PILOT_TTS_MODEL", "gemini-3.1-flash-tts-preview")
VOICE = os.environ.get("NATT_PILOT_TTS_VOICE", "Charon")
SAMPLE_RATE = 24000


def parse_vo_script(path: Path) -> tuple[str, str]:
    raw = path.read_text(encoding="utf-8")
    style = ""
    text = ""
    section = None
    for line in raw.splitlines():
        if line.startswith("Style instructions"):
            section = "style"
            continue
        if line.startswith("Text:"):
            section = "text"
            continue
        if line.startswith("===") or line.startswith("Voice:"):
            continue
        if section == "style" and line.strip():
            style += (" " if style else "") + line.strip()
        if section == "text" and line.strip():
            text += (" " if text else "") + line.strip()
    if not text:
        raise ValueError(f"No VO text in {path}")
    return style.strip(), text.strip()


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

  style, text = parse_vo_script(SCRIPT)
  prompt = f"{style}\n\n{text}" if style else text
  print(f"[tts] model={MODEL} voice={VOICE}")
  print(f"[tts] text={text[:80]}...")

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

  stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
  out = OUT_DIR / f"pilot_hook_{stamp}.wav"
  save_wav(pcm, out)
  print(f"[tts] PASS -> {out} ({len(pcm)} bytes pcm)")
  return 0


if __name__ == "__main__":
  try:
    raise SystemExit(main())
  except Exception as err:
    print(f"[tts] FAIL: {err}", file=sys.stderr)
    raise SystemExit(1)
