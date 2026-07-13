#!/usr/bin/env python3
"""Lossy-compress bundled UI PNGs to WebP for smaller clone/deploy size.

Targets apps/web/public/ui (excludes flags/ — prod uses CDN circle-flags).
Run from hackathon/natt-pundit: python scripts/compress_ui_assets.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / "apps" / "web" / "public" / "ui"
SKIP_DIRS = {"flags"}
MIN_BYTES = 80_000  # keep tiny PNGs (displacement pill, etc.)
QUALITY = 84
MAX_WIDTH = 1920


def compress_png(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    with Image.open(path) as im:
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        w, h = im.size
        if w > MAX_WIDTH:
            nh = int(h * MAX_WIDTH / w)
            im = im.resize((MAX_WIDTH, nh), Image.Resampling.LANCZOS)
        out = path.with_suffix(".webp")
        im.save(out, "WEBP", quality=QUALITY, method=6)
    after = out.stat().st_size
    if after < before:
        path.unlink()
        return before, after
    out.unlink()
    return before, before


def main() -> int:
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")

    total_before = 0
    total_after = 0
    converted = 0

    for png in sorted(UI.rglob("*.png")):
        if any(part in SKIP_DIRS for part in png.parts):
            continue
        if png.stat().st_size < MIN_BYTES:
            continue
        b, a = compress_png(png)
        total_before += b
        total_after += a
        converted += 1
        print(f"  {png.relative_to(UI)}: {b // 1024}KB -> {a // 1024}KB")

    saved = total_before - total_after
    print(
        f"Done: {converted} files, "
        f"{total_before // (1024 * 1024)}MB -> {total_after // (1024 * 1024)}MB "
        f"(saved {saved // (1024 * 1024)}MB)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
