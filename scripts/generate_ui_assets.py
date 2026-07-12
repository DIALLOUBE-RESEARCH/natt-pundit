#!/usr/bin/env python3
"""Generate Natt Settlement UI assets via Gemini Nano Banana Pro.

Modes:
  assets    — hero-bg, card-texture, header-strip
  moodboard — full mobile UI frame for Stitch upload
  flags     — circular WC team flag icons (Stitch style) -> public/ui/flags/
  all       — assets + moodboard (not flags — use flags separately)
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MODEL_PRIMARY = "gemini-3-pro-image-preview"
MODEL_FALLBACK = "gemini-2.0-flash-preview-image-generation"
ROOT = Path(__file__).resolve().parents[1]
UI_DIR = ROOT / "apps" / "web" / "public" / "ui"
FLAGS_DIR = UI_DIR / "flags"
MOOD_DIR = ROOT / "apps" / "web" / "design" / "moodboard"

# Unique ISO codes from apps/web/lib/countryFlags.ts TEAM_ISO
FLAG_ISO_NAMES: dict[str, str] = {
    "dz": "Algeria",
    "ar": "Argentina",
    "au": "Australia",
    "at": "Austria",
    "be": "Belgium",
    "ba": "Bosnia and Herzegovina",
    "br": "Brazil",
    "cv": "Cape Verde",
    "ca": "Canada",
    "co": "Colombia",
    "cd": "DR Congo",
    "ci": "Ivory Coast",
    "hr": "Croatia",
    "cw": "Curacao",
    "cz": "Czechia",
    "ec": "Ecuador",
    "eg": "Egypt",
    "gb-eng": "England St George cross",
    "fr": "France",
    "de": "Germany",
    "gh": "Ghana",
    "ht": "Haiti",
    "ir": "Iran",
    "iq": "Iraq",
    "it": "Italy",
    "jm": "Jamaica",
    "jp": "Japan",
    "jo": "Jordan",
    "kr": "South Korea",
    "mx": "Mexico",
    "ma": "Morocco",
    "nl": "Netherlands",
    "nz": "New Zealand",
    "ng": "Nigeria",
    "no": "Norway",
    "pa": "Panama",
    "py": "Paraguay",
    "pe": "Peru",
    "pl": "Poland",
    "pt": "Portugal",
    "qa": "Qatar",
    "ro": "Romania",
    "sa": "Saudi Arabia",
    "gb-sct": "Scotland",
    "sn": "Senegal",
    "rs": "Serbia",
    "za": "South Africa",
    "es": "Spain",
    "se": "Sweden",
    "ch": "Switzerland",
    "tn": "Tunisia",
    "tr": "Turkey",
    "uy": "Uruguay",
    "us": "United States",
    "ua": "Ukraine",
    "uz": "Uzbekistan",
    "gb-wls": "Wales",
    "cm": "Cameroon",
    "cl": "Chile",
    "cr": "Costa Rica",
    "dk": "Denmark",
    "gr": "Greece",
    "ie": "Ireland",
    "gb-nir": "Northern Ireland",
}

ASSET_PROMPTS = [
    (
        "hero-bg.png",
        "Cinematic stadium night atmosphere only, deep navy #0c1020 and charcoal, "
        "soft golden floodlights from top, subtle 48-module geometric grid at 3% opacity, "
        "empty space for UI overlay center, photoreal ambient NOT a screenshot of an app, "
        "16:9, no text no logos no faces no purple gradient",
    ),
    (
        "card-texture.png",
        "Seamless tileable dark navy panel surface, brushed matte with hairline gold pinstripe, "
        "institutional sports terminal, 512x512 seamless, no text no logos",
    ),
    (
        "header-strip.png",
        "Wide shallow navy header atmosphere strip, gold edge light top, broadcast control room, "
        "1920x120, no text no logos",
    ),
]

STITCH_LIGHT_PROMPTS: list[tuple[str, str] | tuple[str, str, str] | tuple[str, str, str, str]] = [
    (
        "stitch-light-hero.png",
        "Ultra high resolution 2K photorealistic FIFA World Cup stadium for mobile app hero. "
        "Camera elevated from midfield: LUSH GREEN FOOTBALL PITCH fills the LOWER 55% of frame "
        "(stripes visible, crisp grass texture). Stadium stands only in upper background, softly out of focus. "
        "TOP 30% must be pale clear sky with soft haze — empty safe zone for UI buttons, NO lens flare, "
        "NO sun blowout, NO crowd close-ups, NO faces. Bright golden hour daylight. "
        "Premium Apple sports app aesthetic. Portrait composition 9:16.",
        "9:16",
        "2K",
    ),
    (
        "stadiums/metlife-stadium.png",
        "RAW aerial photograph MetLife Stadium East Rutherford NJ. "
        "HIGH NOON bright midday sun overhead — NOT sunset NOT golden hour. "
        "Crystal blue sky, vivid green NFL field, silver louver facade recognizable. "
        "Full bleed photorealistic 16:9. "
        "FORBIDDEN: warm orange tint, long shadows, glass UI, overlays, text, logos.",
        "16:9",
        "2K",
    ),
    (
        "stadiums/azteca-stadium.png",
        "RAW aerial photograph Estadio Azteca Mexico City. "
        "HIGH NOON bright midday sun overhead — NOT sunset NOT golden hour. "
        "Crystal blue sky, pitch fully sunlit, concrete bowl and cantilever roof recognizable. "
        "Full bleed photorealistic 16:9. "
        "FORBIDDEN: warm orange tint, long shadows, glass UI, overlays, text, logos.",
        "16:9",
        "2K",
    ),
    (
        "stadiums/sofi-stadium.png",
        "RAW aerial drone photograph of SoFi Stadium Inglewood California, daytime. "
        "Full bleed edge-to-edge photorealistic sports photography. Translucent canopy roof. "
        "Green pitch visible. "
        "FORBIDDEN: UI mockup, glass panel, frosted overlay, rounded frame, borders, text, logos.",
        "16:9",
        "2K",
    ),
    (
        "stadiums/mercedes-benz-stadium.png",
        "RAW aerial drone photograph of Mercedes-Benz Stadium Atlanta, daytime. "
        "Full bleed edge-to-edge photorealistic sports photography. Retractable petal roof facade. "
        "Green pitch visible. "
        "FORBIDDEN: UI mockup, glass panel, frosted overlay, rounded frame, borders, text, logos.",
        "16:9",
        "2K",
    ),
]

NIGHT_STADIUM_EDIT_SUFFIX = (
    "Transform into a premium NIGHT MATCH photograph. Keep the SAME stadium architecture, "
    "camera angle, framing and composition as the reference. Deep navy night sky, stadium "
    "floodlights fully ON with warm golden-white light pools on the green pitch, subtle crowd "
    "glow in stands, cinematic sports broadcast night photography. Photorealistic full bleed "
    "16:9. FORBIDDEN: daylight, UI mockup, glass overlay, text, logos, watermarks."
)

STITCH_DARK_STADIUM_EDITS: list[tuple[str, str]] = [
    ("stadiums/night/metlife-stadium-night.png", "stadiums/metlife-stadium.png"),
    ("stadiums/night/azteca-stadium-night.png", "stadiums/azteca-stadium.png"),
    ("stadiums/night/sofi-stadium-night.png", "stadiums/sofi-stadium.png"),
    ("stadiums/night/mercedes-benz-stadium-night.png", "stadiums/mercedes-benz-stadium.png"),
]

MOODBOARD_PROMPTS = [
    (
        "moodboard-home-mobile.png",
        "Full mobile app screen UI mockup product Natt Settlement sports analytics PWA. "
        "FIFA World Cup 2026 INSPIRED black #0A0A0A white type gold #C8A951 accents USA blue #1D428A. "
        "Barlow Condensed headlines Inter body. Fixture cards with flags SETUP green HOLD gray pills. "
        "Premium iOS 2026 quality large title 20px card radius navy material blur. "
        "Stadium night 48-module grid 4% background. Powered by TxODDS footer area. "
        "NO FIFA trophy emblem NO purple AI gradient English labels. 9:19 mobile frame.",
    ),
    (
        "moodboard-match-mobile.png",
        "Full mobile match detail UI mockup Natt Settlement same design system. "
        "Large gold score center team flags LIVE tag odds row conviction gauge "
        "monospace decomposition table Merkle proof section. WC26 black white gold navy. "
        "iOS 2026 premium sports data app English NO FIFA emblem NO purple gradient 9:19.",
    ),
]


def flag_prompt(country_label: str) -> str:
    return (
        f"Single circular embroidered fabric patch (ecusson broderie) of the {country_label} national flag. "
        "Stitch UI style: realistic woven textile, visible thread texture and stitch borders, "
        "orthographic straight-on view (NO perspective tilt), perfect geometric circle patch (NOT oval), "
        "patch centered on square 1:1 canvas, patch fills 92% of frame width, dark navy background, "
        "rich saturated colors, tactile cloth surface, 1024x1024 square PNG, NO text NO labels NO FIFA logo "
        "NO flat vector graphic NO rectangular flag outside circle."
    )


def generate_image(
    api_key: str,
    prompt: str,
    model: str,
    *,
    aspect_ratio: str | None = None,
    image_size: str | None = None,
) -> bytes:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    generation_config: dict[str, object] = {"responseModalities": ["IMAGE", "TEXT"]}
    if aspect_ratio or image_size:
        image_config: dict[str, str] = {}
        if aspect_ratio:
            image_config["aspectRatio"] = aspect_ratio
        if image_size:
            image_config["imageSize"] = image_size
        generation_config["imageConfig"] = image_config
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise RuntimeError(f"No image in response: {json.dumps(data)[:500]}")


def generate_image_edit(
    api_key: str,
    image_path: Path,
    prompt: str,
    model: str,
    *,
    aspect_ratio: str | None = None,
    image_size: str | None = None,
) -> bytes:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    generation_config: dict[str, object] = {"responseModalities": ["IMAGE", "TEXT"]}
    if aspect_ratio or image_size:
        image_config: dict[str, str] = {}
        if aspect_ratio:
            image_config["aspectRatio"] = aspect_ratio
        if image_size:
            image_config["imageSize"] = image_size
        generation_config["imageConfig"] = image_config
    mime = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
    b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
    body = {
        "contents": [
            {
                "parts": [
                    {"inlineData": {"mimeType": mime, "data": b64}},
                    {"text": prompt},
                ]
            }
        ],
        "generationConfig": generation_config,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise RuntimeError(f"No image in response: {json.dumps(data)[:500]}")


def run_stitch_dark_stadiums(api_key: str, skip_existing: bool) -> int:
    failed = 0
    for out_rel, src_rel in STITCH_DARK_STADIUM_EDITS:
        src = UI_DIR / src_rel
        out = UI_DIR / out_rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if skip_existing and out.exists() and out.stat().st_size > 50_000:
            print(f"SKIP {out_rel} ({out.stat().st_size} bytes)")
            continue
        if not src.exists():
            print(f"MISSING source {src}", file=sys.stderr)
            failed += 1
            continue
        print(f"Night edit {src_rel} -> {out_rel}...")
        last_err: Exception | None = None
        for model in (MODEL_PRIMARY, MODEL_FALLBACK):
            try:
                raw = generate_image_edit(
                    api_key,
                    src,
                    NIGHT_STADIUM_EDIT_SUFFIX,
                    model,
                    aspect_ratio="16:9",
                    image_size="2K",
                )
                out.write_bytes(raw)
                print(f"  OK {out} ({len(raw)} bytes) via {model}")
                last_err = None
                break
            except Exception as e:
                last_err = e
                print(f"  FAIL {model}: {e}", file=sys.stderr)
        if last_err is not None:
            failed += 1
        time.sleep(2)
    return 1 if failed else 0


def run_batch(
    api_key: str,
    items: list[tuple[str, str] | tuple[str, str, str] | tuple[str, str, str, str]],
    out_root: Path,
) -> int:
    out_root.mkdir(parents=True, exist_ok=True)
    for item in items:
        filename = item[0]
        prompt = item[1]
        aspect_ratio = item[2] if len(item) > 2 else None
        image_size = item[3] if len(item) > 3 else None
        out = out_root / filename
        print(f"Generating {filename}...")
        last_err: Exception | None = None
        for model in (MODEL_PRIMARY, MODEL_FALLBACK):
            try:
                raw = generate_image(
                    api_key,
                    prompt,
                    model,
                    aspect_ratio=aspect_ratio,
                    image_size=image_size,
                )
                out.write_bytes(raw)
                print(f"  OK {out} ({len(raw)} bytes) via {model}")
                last_err = None
                break
            except urllib.error.HTTPError as e:
                err = e.read().decode("utf-8", errors="replace")
                last_err = RuntimeError(f"HTTP {e.code}: {err[:800]}")
                print(f"  FAIL {model}: {last_err}", file=sys.stderr)
            except Exception as e:
                last_err = e
                print(f"  FAIL {model}: {e}", file=sys.stderr)
        if last_err is not None:
            return 1
    return 0


def run_flags(api_key: str, skip_existing: bool, only: list[str] | None) -> int:
    FLAGS_DIR.mkdir(parents=True, exist_ok=True)
    manifest_path = FLAGS_DIR / "manifest.json"
    manifest: dict[str, object] = {"model": MODEL_PRIMARY, "flags": {}}
    if manifest_path.exists():
        try:
            loaded = json.loads(manifest_path.read_text(encoding="utf-8"))
            if isinstance(loaded.get("flags"), dict):
                manifest["flags"] = dict(loaded["flags"])
        except json.JSONDecodeError:
            pass
    isos = sorted(FLAG_ISO_NAMES.keys())
    if only:
        want = {x.lower() for x in only}
        isos = [i for i in isos if i in want]

    failed = 0
    for iso in isos:
        filename = f"{iso}.png"
        out = FLAGS_DIR / filename
        if skip_existing and out.exists() and out.stat().st_size > 500:
            print(f"SKIP {filename} ({out.stat().st_size} bytes)")
            manifest["flags"][iso] = {"file": filename, "bytes": out.stat().st_size, "skipped": True}
            continue

        label = FLAG_ISO_NAMES[iso]
        print(f"Flag {iso} ({label})...")
        prompt = flag_prompt(label)
        last_err: Exception | None = None
        for model in (MODEL_PRIMARY, MODEL_FALLBACK):
            try:
                raw = generate_image(api_key, prompt, model)
                out.write_bytes(raw)
                print(f"  OK {out} ({len(raw)} bytes) via {model}")
                manifest["flags"][iso] = {"file": filename, "bytes": len(raw), "model": model}
                last_err = None
                break
            except Exception as e:
                last_err = e
                print(f"  FAIL {model}: {e}", file=sys.stderr)
        if last_err is not None:
            failed += 1
            manifest["flags"][iso] = {"error": str(last_err)[:200]}
        else:
            manifest_path = FLAGS_DIR / "manifest.json"
            manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        time.sleep(1.5)

    expected = len(isos)
    done = sum(
        1
        for v in manifest["flags"].values()
        if (v.get("model") or v.get("skipped")) and not v.get("error")
    )
    manifest["expected_count"] = expected
    manifest["regenerated_count"] = done

    manifest_path = FLAGS_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Manifest -> {manifest_path} ({done}/{expected} regen, {failed} failed)")
    if done < expected:
        print(f"INCOMPLETE: {expected - done} flags missing or failed", file=sys.stderr)
        return 1
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("all", "assets", "moodboard", "flags", "stitch-light", "stitch-dark-stadiums"), default="all")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate flags even if PNG exists (implies --mode flags unless mode set)",
    )
    parser.add_argument("--only", help="Comma-separated ISO codes e.g. fr,se,us")
    args = parser.parse_args()

    if args.force and args.mode == "all":
        args.mode = "flags"
    skip_existing = args.skip_existing and not args.force

    api_key = os.environ.get("GOOGLE_AI_API_KEY", "").strip()
    if not api_key:
        print("GOOGLE_AI_API_KEY missing", file=sys.stderr)
        return 1

    only_list = [x.strip() for x in args.only.split(",")] if args.only else None

    if args.mode == "flags":
        return run_flags(api_key, skip_existing, only_list)
    if args.mode == "stitch-light":
        return run_batch(api_key, STITCH_LIGHT_PROMPTS, UI_DIR)
    if args.mode == "stitch-dark-stadiums":
        return run_stitch_dark_stadiums(api_key, skip_existing)
    if args.mode in ("all", "assets"):
        code = run_batch(api_key, ASSET_PROMPTS, UI_DIR)
        if code != 0:
            return code
    if args.mode in ("all", "moodboard"):
        code = run_batch(api_key, MOODBOARD_PROMPTS, MOOD_DIR)
        if code != 0:
            return code
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
