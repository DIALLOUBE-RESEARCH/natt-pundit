#!/usr/bin/env python3
"""Pilot Veo cold open — async job; saves operation metadata + downloaded clip if local."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
PROMPT_FILE = Path(
    os.environ.get(
        "NATT_VEO_PROMPT_FILE",
        str(ROOT / "01_scripts" / "intro_veo.txt"),
    ),
)
OUT_DIR = ROOT / "02_generative" / "veo"
OUT_FIXED_NAME = os.environ.get("NATT_VEO_OUT_NAME", "intro_veo_9x16_silent.mp4")

MODEL = os.environ.get("NATT_PILOT_VEO_MODEL", "veo-3.1-generate-preview")
GCS_URI = os.environ.get("NATT_PILOT_VEO_GCS_URI", "").strip()
STRIP_AUDIO = os.environ.get("NATT_PILOT_VEO_STRIP_AUDIO", "true").lower() in ("1", "true", "yes")


def strip_audio_inplace(path: Path) -> None:
    """Remove audio track in-place. Veo API always bakes audio — one file out, no duplicate."""
    try:
        import imageio_ffmpeg
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "imageio-ffmpeg", "-q"])
        import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    tmp = path.with_suffix(".tmp.mp4")
    subprocess.check_call(
        [ffmpeg, "-y", "-i", str(path), "-c:v", "copy", "-an", str(tmp)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    tmp.replace(path)


def load_prompt(path: Path) -> str:
    lines = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("==="):
            continue
        low = line.lower()
        if low.startswith("duration") or low.startswith("aspect") or "generateaudio" in low:
            continue
        if line.strip():
            lines.append(line.strip())
    return " ".join(lines)


def assert_owner_gate() -> None:
    brief = ROOT / "00_brief" / "CREATIVE_BRIEF_INTRO.md"
    if os.environ.get("NATT_VEO_OWNER_GO", "").strip().lower() in ("1", "true", "yes"):
        return
    if not brief.exists():
        raise SystemExit(
            "[veo] BLOCKED — fill 00_brief/CREATIVE_BRIEF_INTRO.md with owner, then set NATT_VEO_OWNER_GO=1 or say go veo",
        )
    text = brief.read_text(encoding="utf-8")
    if "[x]" in text.lower() and "go veo" in text.lower():
        return
    raise SystemExit(
        "[veo] BLOCKED — complete CREATIVE_BRIEF_INTRO.md + check « go veo », or NATT_VEO_OWNER_GO=1",
    )


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    assert_owner_gate()
    use_vertex = os.environ.get("NATT_USE_VERTEX", "0") == "1"
    if use_vertex:
        project = os.environ.get("GCP_PROJECT_ID", "hypernatt-prod")
        location = os.environ.get("NATT_VERTEX_LOCATION", "us-central1")
        print(f"[veo] Using Vertex AI on GCP -> project={project}, location={location}")
        client = genai.Client(vertexai=True, project=project, location=location)
    else:
        api_key = os.environ.get("GOOGLE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
        print("[veo] Using Google AI Studio (Developer API)")
        client = genai.Client(api_key=api_key) if api_key else genai.Client()

    prompt = load_prompt(PROMPT_FILE)
    aspect = os.environ.get("NATT_PILOT_VEO_ASPECT", "9:16")
    resolution = os.environ.get("NATT_PILOT_VEO_RESOLUTION", "720p")

    print(f"[veo] model={MODEL} aspect={aspect}")
    print("[veo] ONE output file only — audio stripped in-place (API still generates audio internally)")
    print(f"[veo] prompt={prompt[:100]}...")

    config_kwargs: dict = {
        "aspect_ratio": aspect,
        "resolution": resolution,
        "duration_seconds": int(os.environ.get("NATT_PILOT_VEO_DURATION", "8")),
        "number_of_videos": 1,
        "negative_prompt": os.environ.get(
            "NATT_PILOT_VEO_NEGATIVE_PROMPT",
            "3D render, video game, playstation, CGI cartoon, low poly, blurry, "
            "night, rain, storm, dark, abstract particles, blue bubbles, screensaver, "
            "letterboxing, black bars, pillarboxing, 16:9 widescreen, horizontal crop, "
            "Nike swoosh, Nike logo, Adidas stripes, Puma, watermark, music, dialogue, sound effects",
        ),
    }
    if GCS_URI:
        config_kwargs["output_gcs_uri"] = GCS_URI
        print(f"[veo] output_gcs_uri={GCS_URI}")

    operation = client.models.generate_videos(
        model=MODEL,
        prompt=prompt,
        config=types.GenerateVideosConfig(**config_kwargs),
    )

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta_path = OUT_DIR / f"pilot_cold_open_{stamp}_operation.json"

    poll_s = int(os.environ.get("NATT_PILOT_VEO_POLL_S", "15"))
    max_wait = int(os.environ.get("NATT_PILOT_VEO_MAX_WAIT_S", "600"))
    deadline = time.time() + max_wait

    while not operation.done:
        if time.time() > deadline:
            meta_path.write_text(operation.model_dump_json(indent=2), encoding="utf-8")
            print(f"[veo] TIMEOUT — metadata saved: {meta_path}")
            return 2
        print(f"[veo] polling... ({poll_s}s)")
        time.sleep(poll_s)
        operation = client.operations.get(operation)

    meta_path.write_text(operation.model_dump_json(indent=2), encoding="utf-8")
    print(f"[veo] operation done -> {meta_path}")

    if operation.response and operation.response.generated_videos:
        vid = operation.response.generated_videos[0]
        out_mp4 = OUT_DIR / OUT_FIXED_NAME
        if hasattr(vid, "video") and vid.video:
            client.files.download(file=vid.video)
            vid.video.save(str(out_mp4))
            if STRIP_AUDIO:
                strip_audio_inplace(out_mp4)
            print(f"[veo] PASS -> {out_mp4} (silent, single file)")
        else:
            print("[veo] PASS (remote only — set NATT_PILOT_VEO_GCS_URI or check operation JSON)")
    else:
        print("[veo] FAIL — no generated_videos in response", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as err:
        print(f"[veo] FAIL: {err}", file=sys.stderr)
        raise SystemExit(1)
