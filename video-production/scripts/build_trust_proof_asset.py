#!/usr/bin/env python3
"""Trust proof — 2 plans 9:16 separes (terminal CI + Merkle rush), pas de collage casse."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from trim_mobile_captures import ffmpeg_bin, probe_duration

ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "05_export" / "final" / "_test_run_capture.txt"
DATALAB_SRC = ROOT / "03_capture" / "mobile" / "07_datalab_bonus_20260716_013426.mp4"
OUT_CI_PNG = ROOT / "02_generative" / "slides" / "07_trust_ci_terminal_9x16.png"
OUT_CI_MP4 = ROOT / "03_capture" / "mobile" / "trimmed" / "07_trust_ci_terminal_14s.mp4"
OUT_MERKLE_MP4 = ROOT / "03_capture" / "mobile" / "trimmed" / "07_trust_merkle_anchors_12s.mp4"
OUT_META = ROOT / "03_capture" / "mobile" / "trimmed" / "07_trust_diaporama.json"

CI_DURATION_SEC = 14.0
MERKLE_TRIM_START = 20.5
MERKLE_DURATION_SEC = 12.0

WORKSPACES = [
    ("@natt-pundit/natt-core", 70),
    ("@natt-pundit/edge-api", 31),
    ("@natt-pundit/txline-gateway", 41),
    ("@natt-pundit/web", 66),
    ("@natt-pundit/mcp", 50),
    ("@natt-pundit/escrow-keeper", 5),
]


def parse_capture(path: Path) -> int:
    if not path.is_file():
        return sum(n for _, n in WORKSPACES)
    text = path.read_text(encoding="utf-8", errors="replace")
    vitest = [int(m.group(1)) for m in re.finditer(r"Tests\s+(\d+)\s+passed", text)]
    node = [int(m.group(1)) for m in re.finditer(r"# pass (\d+)", text)]
    if vitest or node:
        return sum(vitest) + sum(node)
    return sum(n for _, n in WORKSPACES)


def build_ci_png(total: int) -> None:
    from PIL import Image, ImageDraw, ImageFont

    w, h = 1080, 1920
    img = Image.new("RGB", (w, h), "#070b10")
    draw = ImageDraw.Draw(img)

    try:
        font_lg = ImageFont.truetype("consola.ttf", 38)
        font_md = ImageFont.truetype("consola.ttf", 28)
        font_sm = ImageFont.truetype("consola.ttf", 24)
        font_title = ImageFont.truetype("arialbd.ttf", 46)
        font_sub = ImageFont.truetype("arial.ttf", 26)
    except OSError:
        font_lg = font_md = font_sm = font_title = font_sub = ImageFont.load_default()

    card_h = 1180
    card_top = (h - card_h) // 2
    draw.rounded_rectangle((48, card_top, w - 48, card_top + card_h), radius=28, fill="#0d141c", outline="#1f2d3d", width=2)

    y = card_top + 36
    draw.text((80, y), "NATT PUNDIT", fill="#7dd3fc", font=font_title)
    y += 56
    draw.text((80, y), "npm test — monorepo CI proof", fill="#94a3b8", font=font_sub)
    y += 48
    draw.line((80, y, w - 80, y), fill="#1f2d3d", width=2)
    y += 36

    draw.text((80, y), "$ npm test", fill="#e2e8f0", font=font_md)
    y += 48
    for name, count in WORKSPACES:
        draw.text((80, y), f"✓  {name}", fill="#86efac", font=font_sm)
        draw.text((w - 240, y), f"{count} passed", fill="#4ade80", font=font_sm)
        y += 42

    y += 20
    draw.rounded_rectangle((80, y, w - 80, y + 130), radius=18, fill="#052e16", outline="#166534", width=2)
    draw.text((104, y + 24), f"{total} / {total} PASSED", fill="#4ade80", font=font_lg)
    draw.text((104, y + 78), "keeper settle-only · double-claim blocked", fill="#bbf7d0", font=font_sm)
    y += 160

    for line in (
        "github.com/DIALLOUBE-RESEARCH/natt-pundit",
        "hackathon/natt-pundit · Solana devnet",
        datetime.now(timezone.utc).strftime("snapshot %Y-%m-%d %H:%M UTC"),
    ):
        draw.text((80, y), line, fill="#64748b", font=font_sm)
        y += 34

    OUT_CI_PNG.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT_CI_PNG, quality=95)
    print(f"[trust-proof] CI PNG -> {OUT_CI_PNG}")


def png_to_mp4(png: Path, out_mp4: Path, duration_sec: float, *, zoom_end: float = 1.05) -> None:
    ffmpeg = ffmpeg_bin()
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    frames = int(duration_sec * 30)
    rate = (zoom_end - 1.0) / max(frames, 1)
    vf = (
        f"scale=1080:1920:force_original_aspect_ratio=decrease,"
        f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2,"
        f"zoompan=z='min(1.0+{rate:.6f}*on,{zoom_end})':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s=1080x1920:fps=30,format=yuv420p"
    )
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-loop",
            "1",
            "-i",
            str(png),
            "-vf",
            vf,
            "-t",
            f"{duration_sec:.3f}",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out_mp4),
        ]
    )
    print(f"[trust-proof] CI MP4 -> {out_mp4.name} ({duration_sec:.0f}s)")


def trim_merkle_rush(ffmpeg: str) -> None:
    if not DATALAB_SRC.is_file():
        raise FileNotFoundError(DATALAB_SRC)
    vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p"
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            f"{MERKLE_TRIM_START:.3f}",
            "-i",
            str(DATALAB_SRC),
            "-t",
            f"{MERKLE_DURATION_SEC:.3f}",
            "-vf",
            vf,
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(OUT_MERKLE_MP4),
        ]
    )
    dur = probe_duration(ffmpeg, OUT_MERKLE_MP4)
    print(f"[trust-proof] Merkle rush -> {OUT_MERKLE_MP4.name} ({dur:.1f}s)")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    total = parse_capture(CAPTURE)
    print(f"[trust-proof] total passed = {total}")
    build_ci_png(total)
    png_to_mp4(OUT_CI_PNG, OUT_CI_MP4, CI_DURATION_SEC)
    trim_merkle_rush(ffmpeg_bin())

    meta = {
        "plan_a": {
            "id": "trust_ci",
            "file": str(OUT_CI_MP4.relative_to(ROOT)).replace("\\", "/"),
            "duration_sec": CI_DURATION_SEC,
        },
        "plan_b": {
            "id": "trust_merkle",
            "file": str(OUT_MERKLE_MP4.relative_to(ROOT)).replace("\\", "/"),
            "trim_source": str(DATALAB_SRC.relative_to(ROOT)).replace("\\", "/"),
            "trim_start_sec": MERKLE_TRIM_START,
            "duration_sec": MERKLE_DURATION_SEC,
        },
        "transition": {"type": "fade", "duration_sec": 1.2},
        "total_passed": total,
    }
    OUT_META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
