#!/usr/bin/env python3
"""Concat MCP jury proof: connector + tool permission + Claude MCP response."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from trim_mobile_captures import ffmpeg_bin, probe_duration

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "03_capture" / "mobile" / "06_agent_mcp_claude_102s.mp4"
OUT = ROOT / "03_capture" / "mobile" / "trimmed" / "06_agent_mcp_claude_jury_44s.mp4"

# SHOT_LOG F — connector 27-33s ; permission ~66s ; verdict 96-102s
SEGMENTS: list[tuple[float, float]] = [
    (26.0, 8.5),   # Natt Pundit CUSTOM connector
    (66.0, 36.5),  # Get pundit manifest allow + tools + Jury Summary + verdict
]


def extract_part(ffmpeg: str, src: Path, start: float, dur: float, out: Path) -> None:
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            f"{start:.3f}",
            "-i",
            str(src),
            "-t",
            f"{dur:.3f}",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-an",
            str(out),
        ]
    )


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    if not SRC.is_file():
        print(f"[mcp-trim] missing source: {SRC}", file=sys.stderr)
        return 1

    ffmpeg = ffmpeg_bin()
    src_dur = probe_duration(ffmpeg, SRC)
    tmp_dir = ROOT / "03_capture" / "mobile" / "trimmed" / "_tmp_mcp_jury"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    parts: list[Path] = []
    for i, (start, dur) in enumerate(SEGMENTS):
        if start + dur > src_dur + 0.05:
            print(f"[mcp-trim] WARN segment {i} exceeds source ({start}+{dur} > {src_dur:.1f})")
            dur = max(0.5, src_dur - start)
        part = tmp_dir / f"part_{i:02d}.mp4"
        extract_part(ffmpeg, SRC, start, dur, part)
        parts.append(part)
        print(f"[mcp-trim] part {i}: {start:.1f}s + {dur:.1f}s -> {part.name}")

    list_file = tmp_dir / "concat.txt"
    list_file.write_text("\n".join(f"file '{p.resolve().as_posix()}'" for p in parts), encoding="utf-8")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            str(OUT),
        ]
    )

    out_dur = probe_duration(ffmpeg, OUT)
    meta = {
        "source": str(SRC.relative_to(ROOT)).replace("\\", "/"),
        "output": str(OUT.relative_to(ROOT)).replace("\\", "/"),
        "segments": [{"start_sec": s, "duration_sec": d} for s, d in SEGMENTS],
        "duration_sec": round(out_dur, 2),
        "note": "connector + Get pundit manifest + Claude Jury Summary verdict",
    }
    meta_path = OUT.with_suffix(".json")
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"[mcp-trim] PASS -> {OUT.name} ({out_dur:.1f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
