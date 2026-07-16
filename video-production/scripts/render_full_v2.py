#!/usr/bin/env python3
"""Full v2 assembly — Veo + captures trim + slates, concat hard cuts, mux radio mix."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from render_audio_timeline import ffmpeg_bin, probe_duration, resolve

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "pipeline" / "manifest.full.v5.json"
RADIO_WAV = ROOT / "05_export" / "final" / "full_radio_mix_v5.wav"


def prep_clip(
    ffmpeg: str,
    src: Path,
    out: Path,
    *,
    width: int,
    height: int,
    fps: int,
    duration_sec: float | None = None,
    trim_start_sec: float = 0.0,
) -> float:
    vf = (
        f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={fps},format=yuv420p"
    )
    cmd = [ffmpeg, "-y"]
    if trim_start_sec > 0:
        cmd.extend(["-ss", f"{trim_start_sec:.3f}"])
    cmd.extend(["-i", str(src)])
    cmd.extend(["-vf", vf, "-map", "0:v:0", "-an"])
    cmd.extend(["-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p"])
    if duration_sec is not None:
        cmd.extend(["-t", f"{duration_sec:.3f}"])
    cmd.append(str(out))
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return probe_duration(out)


def make_slate(
    ffmpeg: str,
    out: Path,
    *,
    width: int,
    height: int,
    fps: int,
    duration_sec: float,
    color: str = "0x0a0e14",
    text: str | None = None,
) -> float:
    if text:
        safe = text.replace(":", "\\:").replace("'", "\\'")
        vf = (
            f"scale={width}:{height},fps={fps},format=yuv420p,"
            f"drawtext=fontcolor=white:fontsize=42:text='{safe}':"
            f"x=(w-text_w)/2:y=(h-text_h)/2"
        )
        cmd = [
            ffmpeg,
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c={color}:s={width}x{height}:r={fps}",
            "-vf",
            vf,
            "-t",
            f"{duration_sec:.3f}",
            "-map",
            "0:v:0",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    else:
        cmd = [
            ffmpeg,
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c={color}:s={width}x{height}:r={fps}",
            "-t",
            f"{duration_sec:.3f}",
            "-map",
            "0:v:0",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return duration_sec


def concat_pair(ffmpeg: str, left: Path, right: Path, out: Path) -> float:
    fc = "[0:v][1:v]concat=n=2:v=1:a=0[v]"
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
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return probe_duration(out)


def xfade_pair(
    ffmpeg: str,
    left: Path,
    right: Path,
    out: Path,
    *,
    transition: str,
    duration_sec: float,
    offset_sec: float,
) -> float:
    td = duration_sec
    off = max(0.0, offset_sec)
    fc = f"[0:v][1:v]xfade=transition={transition}:duration={td:.3f}:offset={off:.3f}[v]"
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
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return probe_duration(out)


def concat_clips(ffmpeg: str, clips: list[Path], out: Path) -> float:
    list_file = out.with_suffix(".txt")
    lines = [f"file '{p.resolve().as_posix()}'" for p in clips]
    list_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            "-an",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return probe_duration(out)


def mux_av(ffmpeg: str, video: Path, audio: Path, out: Path, duration_sec: float) -> None:
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-t",
            f"{duration_sec:.3f}",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-ac",
            "2",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build_video_chain(cfg: dict, base: Path, tmp: Path, ffmpeg: str) -> tuple[Path, float]:
    out_cfg = cfg["output"]
    w, h, fps = int(out_cfg["width"]), int(out_cfg["height"]), int(out_cfg["fps"])
    prepared: list[Path] = []
    durations: list[float] = []
    segment_cfgs: list[dict] = []

    for i, seg in enumerate(cfg.get("segments") or []):
        out = tmp / f"seg_{i:02d}_{seg['id']}.mp4"
        if seg.get("slate"):
            slate = seg["slate"]
            d = float(seg.get("duration_sec") or 5)
            make_slate(
                ffmpeg,
                out,
                width=w,
                height=h,
                fps=fps,
                duration_sec=d,
                color=slate.get("color") or "0x0a0e14",
                text=slate.get("text"),
            )
            dur = d
        else:
            rel = seg.get("file")
            if not rel:
                raise RuntimeError(f"segment {seg.get('id')} missing file")
            src = resolve(base, rel)
            if not src.is_file():
                raise FileNotFoundError(src)
            dur = prep_clip(
                ffmpeg,
                src,
                out,
                width=w,
                height=h,
                fps=fps,
                duration_sec=seg.get("duration_sec"),
                trim_start_sec=float(seg.get("trim_start_sec") or 0),
            )
        prepared.append(out)
        durations.append(dur)
        segment_cfgs.append(seg)
        print(f"[full] {seg['id']:18s} {dur:6.2f}s")

    join = str(cfg.get("video_join") or "xfade")
    if join == "concat" or len(prepared) == 1:
        video_concat = tmp / "video_concat.mp4"
        concat_dur = concat_clips(ffmpeg, prepared, video_concat)
        return video_concat, concat_dur

    acc = prepared[0]
    acc_dur = durations[0]
    for j in range(1, len(prepared)):
        tr = segment_cfgs[j - 1].get("transition_out")
        td = float(tr.get("duration_sec") or 0) if tr else 0.0
        nxt_out = tmp / f"join_{j:02d}.mp4"
        if tr and td >= 0.3:
            ttype = str(tr.get("type") or "fade")
            offset = max(0.0, acc_dur - td)
            acc_dur = xfade_pair(
                ffmpeg, acc, prepared[j], nxt_out, transition=ttype, duration_sec=td, offset_sec=offset
            )
            print(f"[full] xfade {j}/{len(prepared)-1} {ttype} {td:.2f}s -> {acc_dur:.2f}s")
        else:
            acc_dur = concat_pair(ffmpeg, acc, prepared[j], nxt_out)
            print(f"[full] concat {j}/{len(prepared)-1} -> {acc_dur:.2f}s")
        acc = nxt_out
    return acc, acc_dur


def build_segments(cfg: dict, base: Path, tmp: Path, ffmpeg: str) -> tuple[list[Path], float]:
    out_cfg = cfg["output"]
    w, h, fps = int(out_cfg["width"]), int(out_cfg["height"]), int(out_cfg["fps"])
    prepared: list[Path] = []
    total = 0.0
    for i, seg in enumerate(cfg.get("segments") or []):
        out = tmp / f"seg_{i:02d}_{seg['id']}.mp4"
        if seg.get("slate"):
            slate = seg["slate"]
            d = float(seg.get("duration_sec") or 5)
            make_slate(
                ffmpeg,
                out,
                width=w,
                height=h,
                fps=fps,
                duration_sec=d,
                color=slate.get("color") or "0x0a0e14",
                text=slate.get("text"),
            )
            dur = d
        else:
            rel = seg.get("file")
            if not rel:
                raise RuntimeError(f"segment {seg.get('id')} missing file")
            src = resolve(base, rel)
            if not src.is_file():
                raise FileNotFoundError(src)
            dur = prep_clip(
                ffmpeg,
                src,
                out,
                width=w,
                height=h,
                fps=fps,
                duration_sec=seg.get("duration_sec"),
                trim_start_sec=float(seg.get("trim_start_sec") or 0),
            )
        prepared.append(out)
        total += dur
        print(f"[full] {seg['id']:18s} {dur:6.2f}s")
    return prepared, total


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, default=MANIFEST)
    ap.add_argument("--radio", type=Path, default=RADIO_WAV)
    ap.add_argument(
        "--remux-video",
        type=Path,
        default=None,
        help="Skip video build; mux this MP4 (video-only or strip audio) with radio mix",
    )
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    cfg = json.loads(args.manifest.read_text(encoding="utf-8"))
    base = args.manifest.parent
    out_mp4 = resolve(base, cfg["output"]["path"])
    audio_dur = float(cfg.get("audio_duration_sec") or 272.0)

    if args.dry_run:
        print(json.dumps(cfg, indent=2))
        return 0

    if not args.radio.is_file():
        timeline_rel = cfg.get("audio_timeline") or "audio_timeline.v4.json"
        timeline_path = resolve(base, timeline_rel)
        from render_audio_timeline import render_audio

        print(f"[full] building radio mix from {timeline_path.name}...")
        render_audio(timeline_path, args.radio, audio_dur)

    if not args.radio.is_file():
        print(f"[full] missing radio mix: {args.radio}", file=sys.stderr)
        return 1

    ffmpeg = ffmpeg_bin()
    out_mp4.parent.mkdir(parents=True, exist_ok=True)

    if args.remux_video:
        if not args.remux_video.is_file():
            print(f"[full] missing remux source: {args.remux_video}", file=sys.stderr)
            return 1
        src = args.remux_video.resolve()
        dst = out_mp4.resolve()
        if src == dst:
            print("[full] ERROR: remux source == output — utiliser un fichier video distinct", file=sys.stderr)
            print("[full]        (remux sur soi-meme corrompt le MP4). Lance sans --remux-video.", file=sys.stderr)
            return 1
        video_dur = probe_duration(args.remux_video)
        final_dur = max(video_dur, audio_dur, probe_duration(args.radio))
        print(f"[full] remux {args.remux_video.name} + radio -> {out_mp4.name}")
        mux_av(ffmpeg, args.remux_video, args.radio, out_mp4, final_dur)
        print(f"[full] PASS -> {out_mp4}")
        return 0

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        print("[full] building video chain...")
        video_path, video_dur = build_video_chain(cfg, base, tmp, ffmpeg)
        print(f"[full] video locked {video_dur:.2f}s")

        final_dur = max(video_dur, audio_dur, probe_duration(args.radio))
        print(f"[full] mux duration {final_dur:.2f}s (audio target {audio_dur:.2f}s)")
        mux_av(ffmpeg, video_path, args.radio, out_mp4, final_dur)

        # master video-only pour futurs remux audio (jamais remux in-place)
        video_master = ROOT / "05_export" / "final" / "video_track_master.mp4"
        subprocess.check_call(
            [ffmpeg, "-y", "-i", str(video_path), "-an", "-c:v", "copy", str(video_master)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print(f"[full] video master -> {video_master}")

    print(f"[full] PASS -> {out_mp4}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
