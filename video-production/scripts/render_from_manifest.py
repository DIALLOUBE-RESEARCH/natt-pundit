#!/usr/bin/env python3
"""
Render submission video from pipeline/manifest.json — FFmpeg only, no Veo.

Usage:
  python render_from_manifest.py
  python render_from_manifest.py --manifest ../pipeline/manifest.json --dry-run

Requires: segments exist (or skips missing with warning). VO optional.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "pipeline" / "manifest.json"


def load_manifest(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "imageio-ffmpeg", "-q"])
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()


def resolve(base: Path, rel: str) -> Path:
    p = (base / rel).resolve()
    return p


def build_video_concat(manifest: Path, cfg: dict, tmp: Path) -> Path | None:
    base = manifest.parent
    w = cfg["output"]["width"]
    h = cfg["output"]["height"]
    fps = cfg["output"]["fps"]
    ffmpeg = ffmpeg_bin()
    scaled: list[Path] = []

    for i, seg in enumerate(cfg.get("segments", [])):
        src = resolve(base, seg["file"])
        if not src.exists():
            print(f"[render] SKIP missing: {src}")
            continue
        dur = seg.get("duration_sec")
        out = tmp / f"seg_{i:02d}.mp4"
        vf = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={fps}"
        cmd = [ffmpeg, "-y", "-i", str(src), "-vf", vf, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p"]
        if dur:
            cmd.extend(["-t", str(dur)])
        cmd.append(str(out))
        subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        scaled.append(out)

    if not scaled:
        print("[render] FAIL no segments", file=sys.stderr)
        return None

    list_file = tmp / "concat.txt"
    list_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in scaled), encoding="utf-8")
    video_out = tmp / "video_only.mp4"
    subprocess.check_call(
        [ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(video_out)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return video_out


def mux_audio(video: Path, manifest: Path, cfg: dict, out: Path) -> None:
    ffmpeg = ffmpeg_bin()
    base = manifest.parent
    audio_cfg = cfg.get("audio") or {}
    vo_rel = audio_cfg.get("voiceover")
    vo_start = float(audio_cfg.get("voiceover_start_sec") or 0)
    vo_vol = float(audio_cfg.get("voiceover_volume") or 1.0)

    if not vo_rel:
        subprocess.check_call([ffmpeg, "-y", "-i", str(video), "-c", "copy", str(out)])
        return

    vo = resolve(base, vo_rel)
    if not vo.exists():
        print(f"[render] WARN VO missing {vo} — video only")
        subprocess.check_call([ffmpeg, "-y", "-i", str(video), "-c", "copy", str(out)])
        return

    delay_ms = int(vo_start * 1000)
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-i",
            str(video),
            "-i",
            str(vo),
            "-filter_complex",
            f"[1:a]adelay={delay_ms}|{delay_ms},volume={vo_vol}[vo];[vo]anull[aout]",
            "-map",
            "0:v",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-shortest",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not args.manifest.exists():
        print(f"[render] copy manifest.example.json → manifest.json and fill paths")
        print(f"[render] expected: {args.manifest}")
        return 1

    cfg = load_manifest(args.manifest)
    out_rel = cfg["output"]["path"]
    out = resolve(args.manifest.parent, out_rel)
    out.parent.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        print(json.dumps(cfg, indent=2))
        return 0

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        video = build_video_concat(args.manifest, cfg, tmp)
        if not video:
            return 1
        mux_audio(video, args.manifest, cfg, out)

    print(f"[render] PASS -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
