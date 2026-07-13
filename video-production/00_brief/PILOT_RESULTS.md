# Pilot render — 2026-07-12 (v2 mobile + silent)

## USE THESE FILES (montage CapCut 9:16)

| Asset | File |
|-------|------|
| B-roll Veo **silent 9:16** | `02_generative/veo/pilot_cold_open_20260712_100235_silent_9x16.mp4` |
| VO male documentary (Charon) | `02_generative/tts/pilot_hook_20260712_100115.wav` |

## IGNORE (bad v1)

- `pilot_cold_open_20260712_095339.mp4` — 16:9 + baked audio
- `pilot_hook_20260712_095228.wav` — female Kore voice

## Why Veo had sound

Veo 3.1 on Gemini API **always** generates audio. `generate_audio=false` is **not supported** on this API.

**Fix:** script auto-exports `*_silent_9x16.mp4` (audio track stripped). Layer TTS + Lyria on top in CapCut.

## Format locked

- Canvas: **9:16** vertical mobile
- VO: **Charon**, deep male Netflix-doc style (see `01_scripts/pilot_00-40_vo.txt`)
