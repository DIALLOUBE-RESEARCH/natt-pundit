#!/usr/bin/env python3
"""Apply owner trim specs to mobile captures — frame-accurate head trim only."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "03_capture" / "mobile"
OUT_DIR = MOBILE / "trimmed"
SPECS_PATH = ROOT / "03_capture" / "TRIM_SPECS.json"

# Owner cuts 2026-07-16 — keep 00:00 through end_tc inclusive (duration = end_tc seconds)
TRIMS: list[dict] = [
    {
        "id": "C",
        "label": "03 Polish i18n",
        "source_glob": "03_polish_i18n_flash*.mp4",
        "end_tc": 15,
        "out_name": "03_polish_i18n_flash_15s.mp4",
    },
    {
        "id": "agent_spain",
        "label": "04 Agence Spain",
        "source_glob": "04_agent_spain_counterbet*.mp4",
        "end_tc": 10,
        "out_name": "04_agent_spain_counterbet_10s.mp4",
    },
    {
        "id": "E",
        "label": "04 Bet France Collect",
        "source_glob": "04_bet_france_collect*.mp4",
        "end_tc": 33,
        "out_name": "04_bet_france_collect_33s.mp4",
    },
    {
        "id": "D",
        "label": "04 Bet France vs Espagne",
        "source_glob": "04_bet_france_vs_spain*.mp4",
        "end_tc": 55,
        "out_name": "04_bet_france_vs_spain_55s.mp4",
    },
]


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "imageio-ffmpeg", "-q"])
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()


def probe_duration(ffmpeg: str, path: Path) -> float:
    import re

    proc = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(path)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", proc.stderr)
    if not m:
        raise RuntimeError(f"cannot probe duration: {path}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def trim_one(ffmpeg: str, src: Path, dst: Path, duration: float) -> dict:
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(src),
        "-t",
        f"{duration:.3f}",
        "-c:v",
        "libx264",
        "-crf",
        "17",
        "-preset",
        "medium",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(dst),
    ]
    subprocess.check_call(cmd)
    out_dur = probe_duration(ffmpeg, dst)
    return {
        "source": str(src.relative_to(ROOT)).replace("\\", "/"),
        "output": str(dst.relative_to(ROOT)).replace("\\", "/"),
        "trim_end_tc_s": duration,
        "source_duration_s": round(probe_duration(ffmpeg, src), 3),
        "output_duration_s": round(out_dur, 3),
    }


def resolve_source(glob_pat: str) -> Path:
    matches = sorted(MOBILE.glob(glob_pat))
    if not matches:
        raise FileNotFoundError(f"no source for glob {glob_pat} in {MOBILE}")
    if len(matches) > 1:
        # prefer longest name match without 'trimmed' in path
        matches = [m for m in matches if "trimmed" not in str(m)]
    return matches[0]


def main() -> int:
    ffmpeg = ffmpeg_bin()
    report: list[dict] = []
    for spec in TRIMS:
        src = resolve_source(spec["source_glob"])
        dst = OUT_DIR / spec["out_name"]
        row = trim_one(ffmpeg, src, dst, float(spec["end_tc"]))
        row.update(
            {
                "id": spec["id"],
                "label": spec["label"],
                "note": f"keep 00:00-00:{spec['end_tc']:02d} inclusive; tail removed",
            }
        )
        report.append(row)
        print(
            f"OK {spec['label']}: {row['source_duration_s']}s -> {row['output_duration_s']}s -> {row['output']}"
        )

    payload = {
        "generated": "trim_mobile_captures.py",
        "out_dir": "03_capture/mobile/trimmed",
        "clips": report,
    }
    SPECS_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {SPECS_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
