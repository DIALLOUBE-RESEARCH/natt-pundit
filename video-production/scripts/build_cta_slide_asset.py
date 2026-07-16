#!/usr/bin/env python3
"""CTA slide 9:16 — repo jury + live app (pas de fond noir texte casse)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from trim_mobile_captures import ffmpeg_bin

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / "02_generative" / "slides" / "08_cta_jury_9x16.png"
OUT_MP4 = ROOT / "03_capture" / "mobile" / "trimmed" / "08_cta_jury_14s.mp4"

PUBLIC_REPO = "github.com/DIALLOUBE-RESEARCH/natt-pundit"
LIVE_APP = "hypernatt.com/fr/nattpundit"
MCP_URL = "hypernatt.com/mcp-pundit"
DURATION_SEC = 14.0


def build_png() -> None:
    from PIL import Image, ImageDraw, ImageFont

    w, h = 1080, 1920
    img = Image.new("RGB", (w, h), "#070b10")
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("arialbd.ttf", 52)
        font_lg = ImageFont.truetype("consola.ttf", 34)
        font_md = ImageFont.truetype("arial.ttf", 30)
        font_sm = ImageFont.truetype("arial.ttf", 26)
    except OSError:
        font_title = font_lg = font_md = font_sm = ImageFont.load_default()

    card_h = 980
    top = (h - card_h) // 2
    draw.rounded_rectangle((48, top, w - 48, top + card_h), radius=28, fill="#0d141c", outline="#1f2d3d", width=2)

    y = top + 48
    draw.text((80, y), "NATT SETTLEMENT", fill="#7dd3fc", font=font_title)
    y += 72
    draw.text((80, y), "TxODDS track · Solana devnet", fill="#94a3b8", font=font_md)
    y += 56
    draw.line((80, y, w - 80, y), fill="#1f2d3d", width=2)
    y += 48

    blocks = [
        ("Open source", PUBLIC_REPO, "#4ade80"),
        ("Live app", LIVE_APP, "#7dd3fc"),
        ("MCP agents", MCP_URL, "#a78bfa"),
    ]
    for label, url, color in blocks:
        draw.text((80, y), label, fill="#64748b", font=font_sm)
        y += 36
        draw.text((80, y), url, fill=color, font=font_lg)
        y += 56

    y += 12
    draw.rounded_rectangle((80, y, w - 80, y + 72), radius=16, fill="#172554", outline="#1e3a8a", width=2)
    draw.text((104, y + 20), "Hackathon deadline · July 19, 2026", fill="#bfdbfe", font=font_md)

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT_PNG, quality=95)
    print(f"[cta-slide] PNG -> {OUT_PNG}")


def build_mp4() -> None:
    ffmpeg = ffmpeg_bin()
    frames = int(DURATION_SEC * 30)
    rate = 0.05 / max(frames, 1)
    vf = (
        f"scale=1080:1920:force_original_aspect_ratio=decrease,"
        f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2,"
        f"zoompan=z='min(1.0+{rate:.6f}*on,1.05)':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s=1080x1920:fps=30,format=yuv420p"
    )
    OUT_MP4.parent.mkdir(parents=True, exist_ok=True)
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
            str(OUT_PNG),
            "-vf",
            vf,
            "-t",
            f"{DURATION_SEC:.3f}",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(OUT_MP4),
        ]
    )
    print(f"[cta-slide] MP4 -> {OUT_MP4}")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    build_png()
    build_mp4()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
