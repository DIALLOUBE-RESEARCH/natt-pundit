#!/usr/bin/env python3
"""Logo overlay on Veo A1: WC Hackathon + Powered by TxODDS, centered, fade-in."""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WEB_BRANDING = ROOT.parent / "apps" / "web" / "public" / "branding"
DEFAULT_BASE = ROOT / "02_generative" / "veo" / "A1_bar_tension_9x16_silent.mp4"
OUT = ROOT / "02_generative" / "intro" / "logo_intro_9x16_silent.mp4"
TMP_DIR = ROOT / "02_generative" / "intro" / "_tmp"

FPS = 30
DURATION_S = 4.0
FADE_IN_S = 1.2
FADE_OUT_S = 0.9
SAFE_MARGIN_X = 0.10  # 10% each side
MAX_STACK_WIDTH_RATIO = 0.80
LABEL = (235, 238, 245)
WHITE = (255, 255, 255)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if sys.platform == "win32":
        windir = Path("C:/Windows/Fonts")
        if bold:
            candidates.extend([windir / "arialbd.ttf", windir / "segoeuib.ttf"])
        else:
            candidates.extend([windir / "arial.ttf", windir / "segoeui.ttf"])
    candidates.extend(
        [
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ]
    )
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def _load_rgba(path: Path) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(f"Missing branding asset: {path}")
    return Image.open(path).convert("RGBA")


def _resize_width(img: Image.Image, target_w: int) -> Image.Image:
    if target_w <= 0:
        return img
    ratio = target_w / img.width
    return img.resize((target_w, max(1, int(img.height * ratio))), Image.Resampling.LANCZOS)


def _text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def _draw_text_shadow(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
) -> None:
    x, y = xy
    for dx, dy in ((2, 2), (1, 1)):
        draw.text((x + dx, y + dy), text, fill=(0, 0, 0, 200), font=font)
    draw.text((x, y), text, fill=fill + (255,), font=font)


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "imageio-ffmpeg", "-q"])
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()


def probe_video_size(path: Path) -> tuple[int, int]:
    ffmpeg = ffmpeg_bin()
    proc = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Video:.*?\s(\d{2,5})x(\d{2,5})", proc.stderr)
    if not match:
        raise RuntimeError(f"Cannot probe video size: {path}")
    return int(match.group(1)), int(match.group(2))


def build_overlay_png(path: Path, width: int, height: int) -> None:
    """RGBA overlay matched 1:1 to base video resolution."""
    contest_path = WEB_BRANDING / "contest-logo.avif"
    tx_path = WEB_BRANDING / "txodds-logo.webp"

    max_w = int(width * MAX_STACK_WIDTH_RATIO)
    line_gap = max(20, int(height * 0.022))

    label_font = _font(max(18, int(width * 0.034)))
    wordmark_font = _font(max(20, int(width * 0.038)), bold=True)
    label_text = "Powered by"
    wordmark_text = "TxODDS"

    probe = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    draw_probe = ImageDraw.Draw(probe)

    contest = _load_rgba(contest_path)
    contest = _resize_width(contest, max_w)

    tx_logo = _load_rgba(tx_path)
    tx_logo = _resize_width(tx_logo, max(28, int(width * 0.075)))

    label_w, label_h = _text_size(draw_probe, label_text, label_font)
    word_w, word_h = _text_size(draw_probe, wordmark_text, wordmark_font)
    row_gap = max(8, int(width * 0.014))

    powered_row_w = label_w + row_gap + tx_logo.width + row_gap + word_w
    powered_row_h = max(label_h, tx_logo.height, word_h)

    # Shrink powered row if still too wide
    if powered_row_w > max_w:
        scale = max_w / powered_row_w
        label_font = _font(max(14, int(label_font.size * scale)))
        wordmark_font = _font(max(16, int(wordmark_font.size * scale)), bold=True)
        tx_logo = _resize_width(tx_logo, max(22, int(tx_logo.width * scale)))
        label_w, label_h = _text_size(draw_probe, label_text, label_font)
        word_w, word_h = _text_size(draw_probe, wordmark_text, wordmark_font)
        powered_row_w = label_w + row_gap + tx_logo.width + row_gap + word_w
        powered_row_h = max(label_h, tx_logo.height, word_h)

    stack_w = max(contest.width, powered_row_w)
    stack_h = contest.height + line_gap + powered_row_h
    stack_left = (width - stack_w) // 2
    stack_top = (height - stack_h) // 2

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    pad_x = int(width * 0.04)
    pad_y = int(height * 0.018)
    draw.rounded_rectangle(
        (
            stack_left - pad_x,
            stack_top - pad_y,
            stack_left + stack_w + pad_x,
            stack_top + stack_h + pad_y,
        ),
        radius=max(12, int(width * 0.02)),
        fill=(0, 0, 0, 100),
    )

    contest_x = stack_left + (stack_w - contest.width) // 2
    canvas.paste(contest, (contest_x, stack_top), contest)

    row_y = stack_top + contest.height + line_gap
    row_x0 = stack_left + (stack_w - powered_row_w) // 2

    label_y = row_y + (powered_row_h - label_h) // 2
    _draw_text_shadow(draw, (row_x0, label_y), label_text, label_font, LABEL)

    tx_x = row_x0 + label_w + row_gap
    tx_y = row_y + (powered_row_h - tx_logo.height) // 2
    canvas.paste(tx_logo, (tx_x, tx_y), tx_logo)

    word_x = tx_x + tx_logo.width + row_gap
    word_y = row_y + (powered_row_h - word_h) // 2
    _draw_text_shadow(draw, (word_x, word_y), wordmark_text, wordmark_font, WHITE)

    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, "PNG")


def render_overlay_video(
    base: Path,
    overlay_png: Path,
    out: Path,
    width: int,
    height: int,
    duration: float,
    fade_in: float,
    fade_out: float = FADE_OUT_S,
) -> None:
    ffmpeg = ffmpeg_bin()
    fade_out_start = max(fade_in + 0.1, duration - fade_out - 0.05)
    filter_complex = (
        f"[1:v]scale={width}:{height}:flags=lanczos,format=rgba,"
        f"fade=t=in:st=0:d={fade_in}:alpha=1,"
        f"fade=t=out:st={fade_out_start}:d={fade_out}:alpha=1[ov];"
        f"[0:v][ov]overlay=0:0:format=auto,format=yuv420p[v]"
    )
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(base),
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
    p = argparse.ArgumentParser(description="Overlay hackathon + TxODDS logos on Veo A1 with fade-in.")
    p.add_argument("--base", type=Path, default=DEFAULT_BASE, help="Base video (default: A1)")
    p.add_argument("--out", type=Path, default=OUT)
    p.add_argument("--duration", type=float, default=DURATION_S)
    p.add_argument("--fade-in", type=float, default=FADE_IN_S)
    p.add_argument("--fade-out", type=float, default=FADE_OUT_S)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if not args.base.is_file():
        print(f"Missing base video: {args.base}", file=sys.stderr)
        return 1

    width, height = probe_video_size(args.base)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    overlay_png = TMP_DIR / f"logo_overlay_{width}x{height}.png"
    build_overlay_png(overlay_png, width, height)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    render_overlay_video(
        args.base, overlay_png, args.out, width, height, args.duration, args.fade_in, args.fade_out
    )
    print(
        f"Wrote {args.out} ({width}x{height}, base={args.base.name}, "
        f"fade_in={args.fade_in}s fade_out={args.fade_out}s)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
