#!/usr/bin/env python3
"""
Pro preview render — xfade video chain + audio_timeline mix + mux.

Usage:
  python render_pro.py
  python render_pro.py --manifest ../pipeline/manifest.v1.json
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from render_audio_timeline import ffmpeg_bin, probe_duration, render_audio, resolve

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "pipeline" / "manifest.v1.json"


def scale_segment(
    src: Path,
    out: Path,
    *,
    width: int,
    height: int,
    fps: int,
    duration_sec: float | None,
) -> float:
    ffmpeg = ffmpeg_bin()
    vf = (
        f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={fps},format=yuv420p"
    )
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(src),
        "-f",
        "lavfi",
        "-i",
        "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-vf",
        vf,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
    ]
    if duration_sec is not None:
        cmd.extend(["-t", f"{duration_sec:.3f}"])
    cmd.append(str(out))
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return probe_duration(out)


def make_slate(
    out: Path,
    *,
    width: int,
    height: int,
    fps: int,
    duration_sec: float,
    color: str = "0x0a0e14",
) -> float:
    ffmpeg = ffmpeg_bin()
    cmd = [
        ffmpeg,
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c={color}:s={width}x{height}:r={fps}",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-t",
        f"{duration_sec:.3f}",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
        str(out),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return duration_sec


def xfade_pair(
    left: Path,
    right: Path,
    out: Path,
    *,
    transition: str,
    duration_sec: float,
    offset_sec: float,
) -> float:
    ffmpeg = ffmpeg_bin()
    td = duration_sec
    off = max(0.0, offset_sec)
    fc = (
        f"[0:v][1:v]xfade=transition={transition}:duration={td:.3f}:offset={off:.3f}[v];"
        f"[0:a][1:a]acrossfade=d={td:.3f}[a]"
    )
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-i",
            str(left),
            "-i",
            str(right),
            "-filter_complex",
            fc,
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return probe_duration(out)


def build_video_chain(manifest_path: Path, cfg: dict, tmp: Path) -> tuple[Path, float]:
    base = manifest_path.parent
    out_cfg = cfg["output"]
    w = int(out_cfg["width"])
    h = int(out_cfg["height"])
    fps = int(out_cfg["fps"])

    prepared: list[Path] = []
    durations: list[float] = []
    transitions: list[dict] = []

    for i, seg in enumerate(cfg.get("segments") or []):
        seg_path = tmp / f"prep_{i:02d}.mp4"
        dur_req = seg.get("duration_sec")
        if seg.get("slate"):
            slate = seg["slate"]
            d = float(dur_req or 5)
            make_slate(
                seg_path,
                width=w,
                height=h,
                fps=fps,
                duration_sec=d,
                color=slate.get("color") or "0x0a0e14",
            )
            durations.append(d)
        else:
            rel = seg.get("file")
            if not rel:
                raise RuntimeError(f"segment {seg.get('id')} missing file")
            src = resolve(base, rel)
            if not src.is_file():
                raise FileNotFoundError(src)
            d = scale_segment(src, seg_path, width=w, height=h, fps=fps, duration_sec=dur_req)
            durations.append(d)
        prepared.append(seg_path)
        tr = seg.get("transition_out")
        if tr and i < len(cfg["segments"]) - 1:
            transitions.append(tr)

    acc = prepared[0]
    acc_dur = durations[0]
    for j in range(1, len(prepared)):
        tr = transitions[j - 1] if j - 1 < len(transitions) else {"type": "fade", "duration_sec": 0.4}
        td = float(tr.get("duration_sec") or 0.4)
        ttype = str(tr.get("type") or "fade")
        offset = max(0.0, acc_dur - td)
        nxt_out = tmp / f"xf_{j:02d}.mp4"
        acc_dur = xfade_pair(acc, prepared[j], nxt_out, transition=ttype, duration_sec=td, offset_sec=offset)
        acc = nxt_out
        print(f"[video] xfade {j}/{len(prepared)-1} type={ttype} td={td:.2f}s total={acc_dur:.2f}s")

    return acc, acc_dur


def mux_video_audio(video: Path, audio_wav: Path, out_mp4: Path) -> None:
    ffmpeg = ffmpeg_bin()
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio_wav),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(out_mp4),
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

    if not args.manifest.is_file():
        print(f"[render_pro] missing manifest: {args.manifest}", file=sys.stderr)
        return 1

    cfg = json.loads(args.manifest.read_text(encoding="utf-8"))
    out_mp4 = resolve(args.manifest.parent, cfg["output"]["path"])
    timeline_rel = cfg.get("audio_timeline") or "audio_timeline.v1.json"
    timeline_path = resolve(args.manifest.parent, timeline_rel)

    if args.dry_run:
        print(json.dumps(cfg, indent=2))
        return 0

    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    radio_wav = out_mp4.with_name(out_mp4.stem + "_radio.wav")

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        print("[render_pro] building video xfade chain...")
        video_path, video_dur = build_video_chain(args.manifest, cfg, tmp)
        print(f"[render_pro] video locked {video_dur:.2f}s")

        print("[render_pro] building radio mix...")
        render_audio(timeline_path, radio_wav, video_dur)

        print("[render_pro] mux final...")
        mux_video_audio(video_path, radio_wav, out_mp4)

    print(f"[render_pro] PASS -> {out_mp4}")
    print(f"[render_pro] radio -> {radio_wav}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
