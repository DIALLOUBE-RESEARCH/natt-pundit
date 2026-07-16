#!/usr/bin/env python3
"""Logo bookend outro: dark slate + WC Hackathon + TxODDS, fade in/out."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from build_logo_intro import build_overlay_png, ffmpeg_bin

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "02_generative" / "intro" / "logo_outro_9x16_silent.mp4"
TMP_DIR = ROOT / "02_generative" / "intro" / "_tmp"

WIDTH = 1080
HEIGHT = 1920
FPS = 30
DURATION_S = 5.0
BG_COLOR = "0x0f1419"
FADE_IN_S = 1.2
FADE_OUT_S = 0.9


def render_outro(
    out: Path,
    overlay_png: Path,
    *,
    duration: float,
    fade_in: float,
    fade_out: float,
    fade_out_at: float | None = None,
) -> None:
    ffmpeg = ffmpeg_bin()
    if fade_out_at is not None:
        fade_out_start = max(fade_in + 0.1, fade_out_at)
    else:
        fade_out_start = max(fade_in + 0.1, duration - fade_out - 0.05)
    filter_complex = (
        f"[1:v]scale={WIDTH}:{HEIGHT}:flags=lanczos,format=rgba,"
        f"fade=t=in:st=0:d={fade_in}:alpha=1,"
        f"fade=t=out:st={fade_out_start}:d={fade_out}:alpha=1[ov];"
        f"[0:v][ov]overlay=0:0:format=auto,format=yuv420p[v]"
    )
    cmd = [
        ffmpeg,
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c={BG_COLOR}:s={WIDTH}x{HEIGHT}:r={FPS}",
        "-loop",
        "1",
        "-i",
        str(overlay_png),
        "-t",
        str(duration),
        "-filter_complex",
        filter_complex,
        "-map",
        "[v]",
        "-an",
        "-r",
        str(FPS),
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        str(out),
    ]
    subprocess.run(cmd, check=True)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Dark slate outro with hackathon + TxODDS logos (fade in/out).")
    p.add_argument("--out", type=Path, default=OUT)
    p.add_argument("--duration", type=float, default=DURATION_S)
    p.add_argument("--fade-in", type=float, default=FADE_IN_S)
    p.add_argument("--fade-out", type=float, default=FADE_OUT_S)
    p.add_argument(
        "--fade-out-at",
        type=float,
        default=None,
        help="Seconds into clip when logo fade-out starts (default: end of clip minus fade-out)",
    )
    return p.parse_args()


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    overlay_png = TMP_DIR / f"logo_overlay_outro_{WIDTH}x{HEIGHT}.png"
    build_overlay_png(overlay_png, WIDTH, HEIGHT)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    render_outro(
        args.out,
        overlay_png,
        duration=args.duration,
        fade_in=args.fade_in,
        fade_out=args.fade_out,
        fade_out_at=args.fade_out_at,
    )
    extra = f" fade_out_at={args.fade_out_at:.2f}s" if args.fade_out_at is not None else ""
    print(
        f"[logo_outro] PASS -> {args.out} "
        f"({WIDTH}x{HEIGHT}, {args.duration:.1f}s, fade_in={args.fade_in}s fade_out={args.fade_out}s{extra})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
