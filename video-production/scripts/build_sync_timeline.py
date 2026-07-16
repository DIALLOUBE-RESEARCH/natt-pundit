#!/usr/bin/env python3
"""Compute video EDL from manifest + emit shot-synced audio_timeline."""
from __future__ import annotations

import json
import subprocess
import sys
import wave
from pathlib import Path

from render_audio_timeline import probe_duration, resolve

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "pipeline" / "manifest.full.v7.json"
TTS_MANIFEST = ROOT / "pipeline" / "tts_manifest_v2.json"


def wav_dur(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def seg_duration(base: Path, seg: dict) -> float:
    if seg.get("duration_sec") is not None:
        return float(seg["duration_sec"])
    if seg.get("slate"):
        return float(seg.get("duration_sec") or 5)
    rel = seg.get("file")
    if not rel:
        return float(seg.get("duration_sec") or 5)
    src = resolve(base, rel)
    trim = float(seg.get("trim_start_sec") or 0)
    full = probe_duration(src)
    if seg.get("duration_sec") is not None:
        return float(seg["duration_sec"])
    return max(0.1, full - trim)


def build_edl(cfg: dict, base: Path) -> list[dict]:
    """Mirror render_full_v2 join: concat hard cuts, xfade on transition_out."""
    segments = cfg.get("segments") or []
    durs = [seg_duration(base, s) for s in segments]
    rows: list[dict] = []
    acc_end = 0.0
    acc_start = 0.0

    for i, seg in enumerate(segments):
        if i == 0:
            start = 0.0
            end = durs[0]
            acc_start, acc_end = start, end
        else:
            tr = segments[i - 1].get("transition_out")
            td = float(tr.get("duration_sec") or 0) if tr else 0.0
            if tr and td >= 0.3:
                start = acc_end - td
                end = start + durs[i]
                acc_end = end
            else:
                start = acc_end
                end = start + durs[i]
                acc_end = end
        rows.append(
            {
                "id": seg["id"],
                "index": i,
                "start_sec": round(start, 2),
                "end_sec": round(end, 2),
                "duration_sec": round(durs[i], 2),
                "xfade_in_sec": round(
                    float(segments[i - 1].get("transition_out", {}).get("duration_sec") or 0)
                    if i > 0 and segments[i - 1].get("transition_out")
                    else 0,
                    2,
                ),
            }
        )
    return rows


# vo_id -> (video_segment_id | None, offset_sec, note)
# offset added to segment.start_sec
VO_BINDINGS: list[tuple[str, str | None, float, str]] = [
    ("founder_intro", "veo_a3", 1.0, "Hamet pendant A3 — finit avant VO fixtures"),
    ("fixtures", "fixtures", 0.5, "grille TxLINE SETUP/HOLD"),
    ("i18n", "i18n", 5.25, "SHOT_LOG: menu langues ~6s, owner -0.75s"),
    ("bet_france", "bet_france", 0.8, "pari France-Spain (match + Phantom + PLACE BET)"),
    ("result_lost", "result_lost", 0.8, "FT LOST + Merkle"),
    ("mcp", "agent_mcp", 0.8, "MCP + Claude — calé sur clip agent_mcp"),
    ("agent_won", "agent_won", 0.8, "agent dashboard WON — calé sur clip agent_won"),
    ("datalab", "datalab", 0.8, "export dataset — calé sur clip datalab"),
    ("trust", "trust_ci", 0.6, "263 tests CI + Merkle diaporama"),
    ("close", "cta_slide", 0.6, "CTA github"),
    ("founder_outro", "founder_outro", 0.5, "merci Hamet"),
]

# twist = double VO + repousse mcp de 11s; wallet/hook inutiles
SKIP_VO = {"wallet", "hook", "agent_twist"}

FOUNDER_ADVANCE_SEC = 5.0  # owner: intro Hamet ~2-3s plus tot (effet reel)
FOUNDER_GAP_BEFORE_CHARON_SEC = 1.8  # silence entre Hamet et Charon fixtures
VO_GAP_SEC = 0.4

# Pont musical bet_france -> result_lost (owner: 1:37-1:53, fades doux)
BRIDGE_MUSIC_START_SEC = 97.0  # 1:37
BRIDGE_MUSIC_END_SEC = 113.0  # 1:53
BRIDGE_MUSIC_FADE_IN_MS = 1800
BRIDGE_MUSIC_FADE_OUT_MS = 2000

# Outro musique : bed des trust/CTA -> fin, fade out des 4:23 (solo_boost = audible sous VO)
OUTRO_MUSIC_FADE_AT_SEC = 263.0  # 4:23
OUTRO_MUSIC_LEAD_SEC = 1.0  # J-cut avant trust_ci
OUTRO_MUSIC_GAIN_DB = -1
OUTRO_MUSIC_STEM_VOLUME = 1.0
SOLO_MUSIC_WEIGHT = 1.15
SOLO_MUSIC_BASELINE = 1.0
# Legere baisse VO outro — assez pour entendre le bed, pas etouffer la voix
OUTRO_VO_SCALE = {
    "trust": 0.92,
    "close": 0.88,
    "founder_outro": 0.85,
}
LOGO_OUTRO_FADE_IN = 1.2
LOGO_OUTRO_FADE_OUT = 0.9
INTRO_MUSIC_GAIN_DB = -4
MUSIC_WEIGHT = 0.18
MUSIC_BASELINE = 0.18


def resolve_vo_overlaps(
    vo_regions: list[dict], base: Path, *, gap: float = VO_GAP_SEC, frozen: set[str] | None = None
) -> None:
    """Aucune double VO — chaque piste commence apres la fin de la precedente."""
    frozen = frozen or set()
    ordered = sorted(vo_regions, key=lambda v: v["start_sec"])
    prev_end = 0.0
    for v in ordered:
        dur = wav_dur(resolve(base, v["file"]))
        if v["id"] in frozen:
            prev_end = max(prev_end, v["start_sec"] + dur)
            continue
        min_start = prev_end + gap
        if v["start_sec"] < min_start:
            print(f"[sync] anti-overlap {v['id']}: {v['start_sec']:.1f}s -> {min_start:.1f}s")
            v["start_sec"] = round(min_start, 2)
        prev_end = v["start_sec"] + dur


def anchor_vo_to_video(vo_regions: list[dict], by_id: dict, bindings: list[tuple]) -> None:
    """Recale chaque VO sur son segment video (sauf intro deja fixee)."""
    skip = {"founder_intro", "fixtures"}
    vo_by_id = {v["id"]: v for v in vo_regions}
    tts_map = {
        "founder_intro": "00_founder_intro",
        "hook": "01_hook",
        "fixtures": "02_fixtures",
        "wallet": "03_wallet",
        "i18n": "04_i18n",
        "bet_france": "05_bet_france",
        "result_lost": "06_result_lost",
        "agent_twist": "07_agent_twist",
        "mcp": "08_mcp",
        "agent_won": "09_agent_won",
        "datalab": "10_datalab",
        "trust": "11_trust",
        "close": "12_close",
        "founder_outro": "13_founder_outro",
    }
    for vo_key, seg_id, offset, note in bindings:
        if vo_key in SKIP_VO or vo_key in skip or not seg_id:
            continue
        row = by_id.get(seg_id)
        v = vo_by_id.get(vo_key)
        if not row or not v:
            continue
        new_start = round(row["start_sec"] + offset, 2)
        if abs(v["start_sec"] - new_start) > 0.05:
            print(f"[sync] anchor {vo_key}: {v['start_sec']:.1f}s -> {new_start:.1f}s (video {seg_id})")
        v["start_sec"] = new_start
        v["note"] = note


def fix_early_demo_chain(vo_regions: list[dict], base: Path, by_id: dict) -> None:
    """i18n calé video ; bet_france après fin i18n (pas de double VO)."""
    vo_by = {v["id"]: v for v in vo_regions}
    i18n = vo_by["i18n"]
    bet = vo_by["bet_france"]
    i18n_end = i18n["start_sec"] + wav_dur(resolve(base, i18n["file"]))
    bet_min = round(i18n_end + VO_GAP_SEC, 2)
    if bet["start_sec"] < bet_min:
        print(f"[sync] bet_france apres fin i18n: {bet['start_sec']:.1f}s -> {bet_min:.1f}s")
        bet["start_sec"] = bet_min


def fix_agent_vo_chain(vo_regions: list[dict], base: Path, by_id: dict) -> None:
    """MCP calé video ; agent_won après fin MCP ; datalab strictement calé video."""
    vo_by = {v["id"]: v for v in vo_regions}
    mcp = vo_by["mcp"]
    won = vo_by["agent_won"]
    lab = vo_by["datalab"]

    mcp_end = mcp["start_sec"] + wav_dur(resolve(base, mcp["file"]))
    won_min = mcp_end + VO_GAP_SEC
    if won["start_sec"] < won_min:
        print(
            f"[sync] agent_won apres fin MCP: {won['start_sec']:.1f}s -> {won_min:.1f}s "
            f"(MCP finit {mcp_end:.1f}s, video agent_won {by_id['agent_won']['start_sec']:.1f}s)"
        )
        won["start_sec"] = round(won_min, 2)

    lab_video = round(by_id["datalab"]["start_sec"] + 0.8, 2)
    if abs(lab["start_sec"] - lab_video) > 0.05:
        print(f"[sync] datalab calé video (pas chain agent): {lab['start_sec']:.1f}s -> {lab_video:.1f}s")
        lab["start_sec"] = lab_video

    won_end = won["start_sec"] + wav_dur(resolve(base, won["file"]))
    datalab_start = by_id["datalab"]["start_sec"]
    if won_end > datalab_start - 0.3:
        print(
            f"[sync] WARN agent_won VO depasse datalab video "
            f"({won_end:.1f}s > {datalab_start:.1f}s) — raccourcir 09_agent_won.wav"
        )


def fix_outro_bookend(vo_regions: list[dict], by_id: dict, base: Path) -> None:
    """close apres trust ; founder apres close — zero double VO."""
    fo = next(v for v in vo_regions if v["id"] == "founder_outro")
    close = next(v for v in vo_regions if v["id"] == "close")
    trust = next((v for v in vo_regions if v["id"] == "trust"), None)

    close_dur = wav_dur(resolve(base, close["file"]))
    cta_video = by_id["cta_slide"]["start_sec"] + 0.6
    slate_start = by_id["founder_outro"]["start_sec"] + 0.5

    close_min = cta_video
    if trust:
        trust_end = trust["start_sec"] + wav_dur(resolve(base, trust["file"]))
        close_min = max(close_min, trust_end + VO_GAP_SEC)

    close["start_sec"] = round(close_min, 2)
    close_end = close["start_sec"] + close_dur
    fo["start_sec"] = round(max(slate_start, close_end + VO_GAP_SEC), 2)
    print(
        f"[sync] outro close @ {close['start_sec']:.1f}s (fin {close_end:.1f}s), "
        f"founder @ {fo['start_sec']:.1f}s"
    )


def sync_logo_outro_to_vo(
    cfg: dict, vo_regions: list[dict], by_id: dict, base: Path
) -> tuple[list[dict], dict]:
    """Logo outro clip + manifest duration = fin VO founder (fade out apres la voix)."""
    fo = next(v for v in vo_regions if v["id"] == "founder_outro")
    fo_end = fo["start_sec"] + wav_dur(resolve(base, fo["file"]))
    seg_start = by_id["founder_outro"]["start_sec"]
    fade_out_at = max(LOGO_OUTRO_FADE_IN + 0.2, fo_end - seg_start)
    duration = round(fade_out_at + LOGO_OUTRO_FADE_OUT + 0.12, 2)

    for seg in cfg["segments"]:
        if seg["id"] == "founder_outro":
            seg["duration_sec"] = duration
            break

    script = ROOT / "scripts" / "build_logo_outro.py"
    subprocess.check_call(
        [
            sys.executable,
            str(script),
            "--duration",
            f"{duration:.3f}",
            "--fade-in",
            str(LOGO_OUTRO_FADE_IN),
            "--fade-out",
            str(LOGO_OUTRO_FADE_OUT),
            "--fade-out-at",
            f"{fade_out_at:.3f}",
        ],
        cwd=str(ROOT / "scripts"),
    )
    print(
        f"[sync] logo outro {duration:.1f}s — fade out @ {fade_out_at:.1f}s "
        f"(fin VO founder {fo_end:.1f}s)"
    )

    MANIFEST.write_text(json.dumps(cfg, indent=2) + "\n", encoding="utf-8")
    edl = build_edl(cfg, base)
    by_id = {r["id"]: r for r in edl}
    return edl, by_id


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    base = MANIFEST.parent
    cfg = json.loads(MANIFEST.read_text(encoding="utf-8"))
    tts = json.loads(TTS_MANIFEST.read_text(encoding="utf-8"))
    tts_by_id = {s["id"]: s for s in tts["segments"]}
    tts_dir = ROOT / "02_generative" / "tts"

    edl = build_edl(cfg, base)
    by_id = {r["id"]: r for r in edl}

    edl_path = ROOT / "pipeline" / "video_edl.v7.json"
    edl_path.write_text(json.dumps({"manifest": MANIFEST.name, "segments": edl}, indent=2), encoding="utf-8")

    vo_regions: list[dict] = []
    schedule_lines: list[str] = ["# VIDEO vs VO — EDL v5 (auto from manifest)", ""]
    schedule_lines.append("| Time | Video | VO |")
    schedule_lines.append("|------|-------|-----|")

    for vo_key, seg_id, offset, note in VO_BINDINGS:
        tts_id = {
            "founder_intro": "00_founder_intro",
            "hook": "01_hook",
            "fixtures": "02_fixtures",
            "wallet": "03_wallet",
            "i18n": "04_i18n",
            "bet_france": "05_bet_france",
            "result_lost": "06_result_lost",
            "agent_twist": "07_agent_twist",
            "mcp": "08_mcp",
            "agent_won": "09_agent_won",
            "datalab": "10_datalab",
            "trust": "11_trust",
            "close": "12_close",
            "founder_outro": "13_founder_outro",
        }[vo_key]

        if vo_key in SKIP_VO:
            continue

        row = by_id.get(seg_id or "")
        if not row and seg_id:
            print(f"[sync] WARN missing segment {seg_id} for {vo_key}")
            continue

        if row:
            start = row["start_sec"] + offset
        else:
            start = 0.0

        meta = next((s for s in tts["segments"] if s["id"] == tts_id), None)
        if not meta:
            continue
        wav = tts_dir / meta["wav"]
        dur = wav_dur(wav) if wav.is_file() else float(meta.get("dur_sec") or 5)

        region = {
            "id": vo_key,
            "file": f"../02_generative/tts/{meta['wav']}",
            "start_sec": round(max(0.0, start), 2),
            "fade_in_ms": 50 if "founder" in vo_key else 70,
            "fade_out_ms": 180 if "founder" in vo_key else 220,
            "note": note,
        }
        if vo_key in OUTRO_VO_SCALE:
            region["vo_volume"] = OUTRO_VO_SCALE[vo_key]
        vo_regions.append(region)

        vid = seg_id or "?"
        schedule_lines.append(
            f"| {start:5.1f}s–{start + dur:5.1f}s | **{vid}** | {vo_key} |"
        )
        end_v = row["end_sec"] if row else 0
        if start + dur > end_v + 1.5 and seg_id not in ("bet_france",):
            print(f"[sync] WARN {vo_key} depasse video {seg_id} ({start + dur:.1f}s > {end_v:.1f}s)")

    # --- Intro Hamet : seul sur l'audio jusqu'a la fin + gap avant Charon ---
    founder = next(v for v in vo_regions if v["id"] == "founder_intro")
    fixtures_vo = next(v for v in vo_regions if v["id"] == "fixtures")
    f_dur = wav_dur(resolve(base, founder["file"]))
    founder["start_sec"] = round(by_id["veo_a3"]["start_sec"] + 0.5 - FOUNDER_ADVANCE_SEC, 2)
    founder["start_sec"] = max(by_id["veo_a2"]["start_sec"] + 0.3, founder["start_sec"])
    f_end = founder["start_sec"] + f_dur
    fixtures_vo["start_sec"] = round(
        max(by_id["fixtures"]["start_sec"] + 0.8, f_end + FOUNDER_GAP_BEFORE_CHARON_SEC),
        2,
    )
    print(
        f"[sync] intro founder @ {founder['start_sec']:.1f}s–{f_end:.1f}s | "
        f"fixtures Charon @ {fixtures_vo['start_sec']:.1f}s (gap {fixtures_vo['start_sec'] - f_end:.1f}s)"
    )

    anchor_vo_to_video(vo_regions, by_id, VO_BINDINGS)
    fix_early_demo_chain(vo_regions, base, by_id)
    fix_agent_vo_chain(vo_regions, base, by_id)
    fix_outro_bookend(vo_regions, by_id, base)
    edl, by_id = sync_logo_outro_to_vo(cfg, vo_regions, by_id, base)
    edl_path = ROOT / "pipeline" / "video_edl.v7.json"
    edl_path.write_text(json.dumps({"manifest": MANIFEST.name, "segments": edl}, indent=2), encoding="utf-8")

    # rebuild schedule: VO vs video
    schedule_lines = ["# VIDEO vs VO — sync v7 (VO calée sur EDL video)", ""]
    schedule_lines.append("| Video (plan) | Video t | VO | VO t |")
    schedule_lines.append("|--------------|---------|-----|------|")
    vo_by_id = {v["id"]: v for v in vo_regions}
    for vo_key, seg_id, offset, _note in VO_BINDINGS:
        if vo_key in SKIP_VO:
            continue
        v = vo_by_id.get(vo_key)
        if not v or not seg_id:
            continue
        row = by_id[seg_id]
        dur = wav_dur(resolve(base, v["file"]))
        schedule_lines.append(
            f"| **{seg_id}** | {row['start_sec']:.0f}-{row['end_sec']:.0f}s "
            f"| {vo_key} | {v['start_sec']:.1f}-{v['start_sec'] + dur:.1f}s |"
        )

    video_end = edl[-1]["end_sec"]
    last_vo_end = max(
        v["start_sec"] + wav_dur(resolve(base, v["file"]))
        for v in vo_regions
    )
    total = max(video_end + 2, last_vo_end + 2, 272.0)

    intro_music_end = round(by_id["fixtures"]["start_sec"] + 8.0, 1)
    outro_music_start = round(by_id["trust_ci"]["start_sec"] - OUTRO_MUSIC_LEAD_SEC, 1)

    total_rounded = round(total, 1)
    close_vo = next(v for v in vo_regions if v["id"] == "close")
    close_end = close_vo["start_sec"] + wav_dur(resolve(base, close_vo["file"]))
    # Fade apres le CTA (~4:29), pas pendant — compromis entre 4:23 et fin merci Hamet
    outro_fade_start = max(OUTRO_MUSIC_FADE_AT_SEC, round(close_end + 0.6, 1))
    outro_fade_out_ms = int(max(3500, (total_rounded - outro_fade_start) * 1000))

    audio = {
        "version": 7,
        "sample_rate": 48000,
        "note": "VO v7 — calée sur video EDL (plus de chain anti-overlap). Twist retiré.",
        "edl_ref": "video_edl.v7.json",
        "total_duration_sec": total_rounded,
        "music_regions": [
            {
                "id": "intro_music",
                "file": "../02_generative/lyria/music_04_outro.wav",
                "start_sec": 0.0,
                "end_sec": intro_music_end,
                "fade_in_ms": 1000,
                "fade_out_ms": 2500,
                "loop": True,
                "gain_db": INTRO_MUSIC_GAIN_DB,
            },
            {
                "id": "bridge_bet_gap",
                "file": "../02_generative/lyria/music_04_outro.wav",
                "start_sec": BRIDGE_MUSIC_START_SEC,
                "end_sec": BRIDGE_MUSIC_END_SEC,
                "fade_in_ms": BRIDGE_MUSIC_FADE_IN_MS,
                "fade_out_ms": BRIDGE_MUSIC_FADE_OUT_MS,
                "loop": True,
                "gain_db": -2,
                "solo_boost": True,
                "note": "owner: combler trou 1:37-1:53 — piste solo (pas ecrasee par duck VO)",
            },
            {
                "id": "outro_music",
                "file": "../02_generative/lyria/music_04_outro.wav",
                "start_sec": outro_music_start,
                "end_sec": total_rounded,
                "fade_in_ms": 2200,
                "fade_out_ms": outro_fade_out_ms,
                "loop": True,
                "gain_db": OUTRO_MUSIC_GAIN_DB,
                "stem_volume": OUTRO_MUSIC_STEM_VOLUME,
                "solo_boost": True,
                "note": (
                    f"bed trust/CTA -> fin (solo equilibre), "
                    f"fade doux des {outro_fade_start:.1f}s"
                ),
            },
        ],
        "vo_regions": vo_regions,
        "duck": {
            "mode": "amix_weights",
            "music_weight": MUSIC_WEIGHT,
            "solo_music_weight": SOLO_MUSIC_WEIGHT,
            "solo_music_baseline_volume": SOLO_MUSIC_BASELINE,
            "vo_volume": 3.2,
            "music_baseline_volume": MUSIC_BASELINE,
            "threshold": 0.015,
            "ratio": 12,
            "attack_ms": 15,
            "release_ms": 380,
        },
        "master": {"loudnorm_I": -14, "loudnorm_TP": -1.0, "loudnorm_LRA": 8},
    }

    out_audio = ROOT / "pipeline" / "audio_timeline.v7.json"
    out_audio.write_text(json.dumps(audio, indent=2), encoding="utf-8")

    md = ROOT / "pipeline" / "VIDEO_VO_SYNC.v7.md"
    md.write_text(
        "\n".join(schedule_lines)
        + "\n\n## Segment video (EDL)\n\n"
        + "| id | start | end | dur |\n|----|-------|-----|-----|\n"
        + "\n".join(f"| {r['id']} | {r['start_sec']} | {r['end_sec']} | {r['duration_sec']} |" for r in edl)
        + "\n",
        encoding="utf-8",
    )

    print(f"[sync] EDL -> {edl_path}")
    print(f"[sync] audio -> {out_audio} ({total:.1f}s)")
    print(f"[sync] doc -> {md}")
    for r in edl:
        print(f"  {r['id']:16s} {r['start_sec']:6.1f} - {r['end_sec']:6.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
