#!/usr/bin/env python3
"""Generate all TTS segments for Natt Pundit pitch v2 (Charon doc + Zubenelgenubi founder)."""
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
ARCHIVE_DIR = OUT_DIR / "_archive_v1"

MODEL = os.environ.get("NATT_PILOT_TTS_MODEL", "gemini-3.1-flash-tts-preview")
VOICE_DOC = os.environ.get("NATT_PILOT_TTS_VOICE", "Charon")
VOICE_FOUNDER = os.environ.get("NATT_FOUNDER_TTS_VOICE", "Zubenelgenubi")
SAMPLE_RATE = 24000

STYLE_CHARON = (
    "[deep male voice] [slow pace] [low register] [authoritative] [netflix documentary]\n"
    "Speak like a premium Netflix tech documentary narrator: deep male baritone, "
    "calm authority, measured pacing, subtle gravitas. Lower pitch, no upspeak, "
    "no sales energy, no cheerfulness. British-leaning neutral English accent. "
    "Pause deliberately before the last sentence. Zero hype."
)

STYLE_FOUNDER = (
    "[friendly male founder] [conversational] [natural pace] [slight vocal smile]\n"
    "[native US English] [direct to camera]\n"
    "Casual but professional — speaking to hackathon judges, not a TikTok audience. "
    "Not salesy. Not documentary. Not deep baritone. Warm and human."
)

SEGMENTS: list[dict[str, str]] = [
    {
        "id": "00_founder_intro",
        "voice": VOICE_FOUNDER,
        "style": STYLE_FOUNDER,
        "text": (
            "Hi — I'm Hamet. This is my hackathon submission: Natt Pundit — "
            "on-chain prediction markets with autonomous AI agents on Solana devnet."
        ),
    },
    {
        "id": "01_hook",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "How fans and autonomous agents settle World Cup stakes — on-chain."
        ),
    },
    {
        "id": "02_fixtures",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Live World Cup fixtures from TxLINE. Each match shows setup or hold — "
            "edge first, not noise. Scroll the grid. France versus Spain is live. "
            "Same rules for every fan."
        ),
    },
    {
        "id": "03_wallet",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Connect Phantom through Reown on Solana devnet. You sign every transaction. "
            "Natt Settlement never holds your private keys."
        ),
    },
    {
        "id": "04_i18n",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Eight languages. One tap — English to Chinese, and back. Same escrow."
        ),
    },
    {
        "id": "05_bet_france",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Open France versus Spain before kickoff. The verdict is hold — Shin consensus "
            "shows the edge is thin. Odds favor France at two sixty-six. Place one devnet "
            "USDC on the home side. Phantom approves the deposit. Shared pool on-chain. "
            "The bet is live — match still running. Fans stake with full transparency. "
            "No hidden custody."
        ),
    },
    {
        "id": "06_result_lost",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Full time. Spain wins two nil. Settlement hits Solana — Merkle proof verified "
            "green. Open the wallet tab: realized P n L minus one USDC. The France bet is "
            "lost — but the outcome is provable. Anyone can audit root, leaf, and explorer "
            "link."
        ),
    },
    {
        "id": "07_agent_twist",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Meanwhile an autonomous agent plays by the same rules. Different side. "
            "Same escrow. No special treatment."
        ),
    },
    {
        "id": "08_mcp",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Connect Agent wires Natt Pundit into Claude. Twenty MCP tools on a read-only "
            "dashboard. Approve one call — get fixture agent status. The agent checked this "
            "match autonomously. Wallet signs on-chain. Agents never hold your keys. Policy "
            "is setup or hold — written in plain English."
        ),
    },
    {
        "id": "09_agent_won",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Agent dashboard: Spain won plus one USDC. Verified on Solana explorer. "
            "Autonomous profit — same proof standard as fans."
        ),
    },
    {
        "id": "10_datalab",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Data Lab exports the full dataset. Proof and odds streams. "
            "Merkle anchors on Solana explorer."
        ),
    },
    {
        "id": "11_trust",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": (
            "Two hundred sixty-three automated tests — all green. Keeper is settle-only. "
            "Double-claim blocked. Open source escrow — auditable before you deposit. "
            "Merkle anchors verified on Solana."
        ),
    },
    {
        "id": "12_close",
        "voice": VOICE_DOC,
        "style": STYLE_CHARON,
        "text": "Natt Settlement. Open source. TxODDS track. July nineteenth.",
    },
    {
        "id": "13_founder_outro",
        "voice": VOICE_FOUNDER,
        "style": STYLE_FOUNDER,
        "text": (
            "Thanks for watching — I really appreciate you taking the time to review this."
        ),
    },
]


def save_wav(pcm: bytes, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def wav_duration_sec(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def archive_v1() -> None:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    legacy = [
        "01_hook.wav",
        "02_reveal.wav",
        "03_stakes.wav",
        "04_reward.wav",
        "05_twist.wav",
        "06_agents.wav",
        "07_trust.wav",
        "08_architecture.wav",
        "09_close.wav",
        "pilot_hook_20260712_095228.wav",
        "pilot_hook_20260712_100115.wav",
    ]
    for name in legacy:
        src = OUT_DIR / name
        if src.exists():
            dst = ARCHIVE_DIR / name
            if dst.exists():
                dst.unlink()
            src.rename(dst)
            print(f"[tts] archived -> {dst.name}")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    only_ids: set[str] | None = None
    skip_archive = "--no-archive" in sys.argv
    if len(sys.argv) > 1:
        only_ids = {arg for arg in sys.argv[1:] if not arg.startswith("-")}

    api_key = os.environ.get("GOOGLE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    if not skip_archive and not only_ids:
        archive_v1()

    segments = SEGMENTS
    if only_ids:
        segments = [s for s in SEGMENTS if s["id"] in only_ids]
        missing = only_ids - {s["id"] for s in segments}
        if missing:
            print(f"[tts] Unknown segment id(s): {', '.join(sorted(missing))}", file=sys.stderr)
            return 1
        if not segments:
            print("[tts] No segments to generate.", file=sys.stderr)
            return 1
        print(f"[tts] Selective regen: {', '.join(sorted(only_ids))}")
    else:
        print(
            f"[tts] Batch v2 model={MODEL} doc={VOICE_DOC} founder={VOICE_FOUNDER} "
            f"segments={len(segments)}"
        )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total_sec = 0.0

    for seg in segments:
        seg_id = seg["id"]
        voice = seg["voice"]
        text = seg["text"]
        prompt = f"{seg['style']}\n\nText:\n{text}"
        out_path = OUT_DIR / f"{seg_id}.wav"

        print(f"[tts] {seg_id} ({voice}) -> '{text[:56]}...'")

        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=[{"parts": [{"text": prompt}]}],
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                        )
                    ),
                ),
            )

            part = response.candidates[0].content.parts[0]
            raw = part.inline_data.data
            pcm = base64.b64decode(raw) if isinstance(raw, str) else raw

            save_wav(pcm, out_path)
            dur = wav_duration_sec(out_path)
            total_sec += dur
            wps = len(text.split()) / dur if dur > 0 else 0.0
            print(f"[tts] PASS -> {out_path.name} dur={dur:.2f}s wps={wps:.2f}")

        except Exception as err:
            print(f"[tts] FAIL on {seg_id}: {err}", file=sys.stderr)
            return 1

    print(f"[tts] Batch v2 done — {len(segments)} files, total VO={total_sec:.1f}s")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as err:
        print(f"[tts] FATAL: {err}", file=sys.stderr)
        raise SystemExit(1)
