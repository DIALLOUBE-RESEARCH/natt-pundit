#!/usr/bin/env python3
"""Mix music + VO from audio_timeline.json — sidechain duck + loudnorm."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "imageio-ffmpeg", "-q"])
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()


def resolve(base: Path, rel: str) -> Path:
    return (base / rel).resolve()


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def probe_duration(path: Path) -> float:
    ffmpeg = ffmpeg_bin()
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


def _db_to_linear(db: float) -> float:
    return 10 ** (db / 20.0)


def _render_music_stem(
    ffmpeg: str,
    music_inputs: list[tuple[Path, dict]],
    duration_sec: float,
    sr: int,
    out_path: Path,
) -> None:
    if not music_inputs:
        subprocess.check_call(
            [
                ffmpeg,
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"anullsrc=r={sr}:cl=stereo",
                "-t",
                f"{duration_sec:.3f}",
                "-c:a",
                "pcm_s16le",
                str(out_path),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    cmd = [ffmpeg, "-y"]
    filters: list[str] = []
    labels: list[str] = []
    for i, (path, region) in enumerate(music_inputs):
        cmd.extend(["-i", str(path)])
        start_sec = float(region.get("start_sec") or 0)
        start_ms = int(start_sec * 1000)
        fade_in = int(region.get("fade_in_ms") or 0)
        fade_out = int(region.get("fade_out_ms") or 0)
        gain = _db_to_linear(float(region.get("gain_db") or 0))
        stem_vol = float(region.get("stem_volume") or 1.0)
        end_sec = region.get("end_sec")
        chain = f"[{i}:a]aformat=sample_rates={sr}:channel_layouts=stereo"
        if region.get("loop"):
            chain += ",aloop=loop=-1:size=2e+09"
        if end_sec is not None:
            trim_end = float(end_sec) - start_sec
            if trim_end > 0:
                chain += f",atrim=0:{trim_end}"
        chain += f",adelay={start_ms}|{start_ms}"
        if fade_in > 0:
            chain += f",afade=t=in:st={start_sec:.3f}:d={fade_in / 1000:.3f}"
        if fade_out > 0 and end_sec is not None:
            fade_out_st = max(start_sec, float(end_sec) - fade_out / 1000)
            chain += f",afade=t=out:st={fade_out_st:.3f}:d={fade_out / 1000:.3f}"
        chain += f",volume={gain * stem_vol:.4f},apad=pad_dur={duration_sec:.3f}[m{i}]"
        filters.append(chain)
        labels.append(f"[m{i}]")

    mix_in = "".join(labels)
    filters.append(
        f"{mix_in}amix=inputs={len(labels)}:duration=longest:dropout_transition=0:"
        f"normalize=0,atrim=0:{duration_sec:.3f}[music]"
    )
    cmd.extend(
        [
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[music]",
            "-c:a",
            "pcm_s16le",
            str(out_path),
        ]
    )
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def render_audio(
    timeline_path: Path,
    out_wav: Path,
    duration_sec: float,
    *,
    dry_run: bool = False,
) -> None:
    base = timeline_path.parent
    cfg = json.loads(timeline_path.read_text(encoding="utf-8"))
    sr = int(cfg.get("sample_rate") or 48000)
    duck = cfg.get("duck") or {}
    master = cfg.get("master") or {}

    music_inputs: list[tuple[Path, dict]] = []
    for region in cfg.get("music_regions") or []:
        rel = region.get("file")
        if not rel:
            continue
        p = resolve(base, rel)
        if not p.is_file():
            print(f"[audio] SKIP missing music: {p}")
            continue
        music_inputs.append((p, region))

    vo_inputs: list[tuple[Path, dict]] = []
    for region in cfg.get("vo_regions") or []:
        rel = region.get("file")
        if not rel:
            continue
        p = resolve(base, rel)
        if not p.is_file():
            print(f"[audio] SKIP missing VO: {p}")
            continue
        vo_inputs.append((p, region))

    if not music_inputs and not vo_inputs:
        raise RuntimeError("no audio inputs found")

    end_candidates = []
    for region in cfg.get("vo_regions") or []:
        p = resolve(base, region["file"])
        if p.is_file():
            end_candidates.append(
                float(region["start_sec"]) + wav_duration(p) + float(region.get("pad_after_sec") or 0)
            )
    if end_candidates:
        duration_sec = max(duration_sec, max(end_candidates) + 2.0)

    if dry_run:
        print(f"[audio] dry-run duration={duration_sec:.2f}s music={len(music_inputs)} vo={len(vo_inputs)}")
        return

    ffmpeg = ffmpeg_bin()
    out_wav.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        music_stem = tmp / "music_bus.wav"
        music_solo_stem = tmp / "music_solo_bus.wav"
        vo_stem = tmp / "vo_bus.wav"

        ducked_music = [(p, r) for p, r in music_inputs if not r.get("solo_boost")]
        solo_music = [(p, r) for p, r in music_inputs if r.get("solo_boost")]

        _render_music_stem(ffmpeg, ducked_music, duration_sec, sr, music_stem)
        _render_music_stem(ffmpeg, solo_music, duration_sec, sr, music_solo_stem)

        if vo_inputs:
            cmd = [ffmpeg, "-y"]
            filters = []
            labels = []
            for i, (path, region) in enumerate(vo_inputs):
                cmd.extend(["-i", str(path)])
                start_sec = float(region["start_sec"])
                start_ms = int(start_sec * 1000)
                fade_in = int(region.get("fade_in_ms") or 0)
                fade_out = int(region.get("fade_out_ms") or 0)
                dur = wav_duration(path)
                chain = (
                    f"[{i}:a]aformat=sample_rates={sr}:channel_layouts=stereo,"
                    f"adelay={start_ms}|{start_ms}"
                )
                if fade_in > 0:
                    chain += f",afade=t=in:st={start_sec:.3f}:d={fade_in / 1000:.3f}"
                if fade_out > 0:
                    fade_out_st = max(start_sec, start_sec + dur - fade_out / 1000)
                    chain += f",afade=t=out:st={fade_out_st:.3f}:d={fade_out / 1000:.3f}"
                region_vol = float(region.get("vo_volume") or 1.0)
                if region_vol != 1.0:
                    chain += f",volume={region_vol:.4f}"
                chain += f",apad=pad_dur={duration_sec:.3f}[v{i}]"
                filters.append(chain)
                labels.append(f"[v{i}]")
            mix_in = "".join(labels)
            filters.append(
                f"{mix_in}amix=inputs={len(labels)}:duration=longest:dropout_transition=0:"
                f"normalize=0,atrim=0:{duration_sec:.3f}[vo]"
            )
            cmd.extend(
                [
                    "-filter_complex",
                    ";".join(filters),
                    "-map",
                    "[vo]",
                    "-c:a",
                    "pcm_s16le",
                    str(vo_stem),
                ]
            )
            subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            subprocess.check_call(
                [
                    ffmpeg,
                    "-y",
                    "-f",
                    "lavfi",
                    "-i",
                    f"anullsrc=r={sr}:cl=stereo",
                    "-t",
                    f"{duration_sec:.3f}",
                    "-c:a",
                    "pcm_s16le",
                    str(vo_stem),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

        baseline = float(duck.get("music_baseline_volume") or 0.42)
        solo_baseline = float(duck.get("solo_music_baseline_volume") or 0.88)
        vo_vol = float(duck.get("vo_volume") or 1.0)
        duck_mode = str(duck.get("mode") or "sidechain")
        music_w = float(duck.get("music_weight") or 0.2)
        solo_w = float(duck.get("solo_music_weight") or 1.0)
        threshold = float(duck.get("threshold") or 0.025)
        ratio = float(duck.get("ratio") or 7)
        attack = int(duck.get("attack_ms") or 25)
        release = int(duck.get("release_ms") or 450)
        i_lufs = float(master.get("loudnorm_I") or -16)
        tp = float(master.get("loudnorm_TP") or -1.5)
        lra = float(master.get("loudnorm_LRA") or 11)

        if duck_mode == "amix_weights" and solo_music:
            filter_complex = (
                f"[0:a]volume={baseline:.3f}[mb];"
                f"[1:a]volume={solo_baseline:.3f}[sb];"
                f"[2:a]volume={vo_vol:.3f}[vol];"
                f"[mb][sb][vol]amix=inputs=3:duration=longest:dropout_transition=0:"
                f"weights={music_w} {solo_w} 1.0[mix];"
                f"[mix]loudnorm=I={i_lufs}:TP={tp}:LRA={lra},"
                f"aformat=sample_rates={sr}:sample_fmts=s16:channel_layouts=stereo[out]"
            )
            mix_inputs = [str(music_stem), str(music_solo_stem), str(vo_stem)]
        elif duck_mode == "amix_weights":
            filter_complex = (
                f"[0:a]volume={baseline:.3f}[mb];"
                f"[1:a]volume={vo_vol:.3f}[vol];"
                f"[mb][vol]amix=inputs=2:duration=longest:dropout_transition=0:"
                f"weights={music_w} 1.0[mix];"
                f"[mix]loudnorm=I={i_lufs}:TP={tp}:LRA={lra},"
                f"aformat=sample_rates={sr}:sample_fmts=s16:channel_layouts=stereo[out]"
            )
            mix_inputs = [str(music_stem), str(vo_stem)]
        else:
            filter_complex = (
                f"[1:a]volume={vo_vol:.3f}[vol];"
                f"[0:a]volume={baseline:.3f}[mb];"
                f"[mb][vol]sidechaincompress=threshold={threshold}:ratio={ratio}:"
                f"attack={attack}:release={release}[ducked];"
                f"[ducked][vol]amix=inputs=2:duration=first:dropout_transition=0[mix];"
                f"[mix]loudnorm=I={i_lufs}:TP={tp}:LRA={lra},"
                f"aformat=sample_rates={sr}:sample_fmts=s16:channel_layouts=stereo[out]"
            )
            mix_inputs = [str(music_stem), str(vo_stem)]

        subprocess.check_call(
            [
                ffmpeg,
                "-y",
                *[arg for p in mix_inputs for arg in ("-i", p)],
                "-filter_complex",
                filter_complex,
                "-map",
                "[out]",
                "-c:a",
                "pcm_s16le",
                str(out_wav),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    print(f"[audio] PASS -> {out_wav} ({duration_sec:.1f}s)")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", type=Path, default=ROOT / "pipeline" / "audio_timeline.v1.json")
    ap.add_argument("--out", type=Path, default=ROOT / "05_export" / "final" / "preview_v1_radio.wav")
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    render_audio(args.timeline, args.out, args.duration, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
