#!/usr/bin/env python3
"""Extract JPEG frames every N seconds from mobile captures for visual shot logging."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from render_audio_timeline import ffmpeg_bin, probe_duration

ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "03_capture" / "mobile"
OUT = ROOT / "03_capture" / "_shot_log_frames"
INTERVAL_SEC = 3.0


def extract_frames(mp4: Path, out_dir: Path, interval: float) -> list[dict]:
    dur = probe_duration(mp4)
    out_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg = ffmpeg_bin()
    # fps=1/N → one frame every N seconds (safe vs seek-at-end bugs)
    fps = 1.0 / interval
    pattern = out_dir / "f_%04d.jpg"
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(mp4.resolve()),
        "-vf",
        f"fps={fps:.6f}",
        "-q:v",
        "3",
        str(pattern),
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    frames = sorted(out_dir.glob("f_*.jpg"))
    entries = []
    for i, jpg in enumerate(frames):
        t = min(i * interval, dur)
        entries.append({"t_sec": round(t, 1), "file": jpg.name})
    return entries


def main() -> int:
    if not MOBILE.exists():
        print(f"missing {MOBILE}", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    report: list[dict] = []
    for mp4 in sorted(MOBILE.glob("*.mp4")):
        slug = mp4.stem
        sub = OUT / slug
        if sub.exists():
            for old in sub.glob("*.jpg"):
                old.unlink()
        try:
            frames = extract_frames(mp4, sub, INTERVAL_SEC)
            dur = probe_duration(mp4)
            report.append(
                {
                    "source": mp4.name,
                    "duration_sec": round(dur, 2),
                    "interval_sec": INTERVAL_SEC,
                    "frame_count": len(frames),
                    "frames_dir": str(sub.relative_to(ROOT)).replace("\\", "/"),
                    "frames": frames,
                }
            )
            print(f"OK {mp4.name} {dur:.1f}s -> {len(frames)} frames")
        except subprocess.CalledProcessError as err:
            print(f"FAIL {mp4.name}: {err.stderr.decode(errors='replace')[:200]}", file=sys.stderr)
            return 1
    meta = ROOT / "03_capture" / "_shot_log_report.json"
    meta.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"wrote {meta}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
