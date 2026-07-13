#!/usr/bin/env python3
"""Generate Natt Pundit music stems via Vertex Lyria-002 (Option B, 4 stems)."""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

import google.auth
import google.auth.transport.requests
import requests

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "01_scripts"
OUT_DIR = ROOT / "02_generative" / "lyria"
LOCATION = "us-central1"
MODEL = "lyria-002"

STEMS = {
    "01": ("lyria_01_intro.json", "music_01_intro.wav"),
    "02": ("lyria_02_demo.json", "music_02_demo.wav"),
    "03": ("lyria_03_agent.json", "music_03_agent.wav"),
    "04": ("lyria_04_outro.json", "music_04_outro.wav"),
}


def access_token() -> tuple[str, str | None]:
    creds, project = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token, project


def generate_stem(stem_id: str, project: str, token: str) -> Path:
    json_name, wav_name = STEMS[stem_id]
    body_path = SCRIPTS / json_name
    out_wav = OUT_DIR / wav_name
    body = json.loads(body_path.read_text(encoding="utf-8"))

    url = (
        f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
        f"projects/{project}/locations/{LOCATION}/publishers/google/models/{MODEL}:predict"
    )
    print(f"[lyria] stem {stem_id} -> {out_wav.name}")
    resp = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=300,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"stem {stem_id} HTTP {resp.status_code}: {resp.text[:500]}")

    data = resp.json()
    meta = OUT_DIR / f"music_{stem_id}_response.json"
    meta.write_text(json.dumps(data, indent=2), encoding="utf-8")

    pred = data["predictions"][0]
    b64 = pred.get("bytesBase64Encoded") or pred.get("audioContent")
    if not b64:
        raise RuntimeError(f"stem {stem_id}: no audio field in response — see {meta}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_wav.write_bytes(base64.b64decode(b64))
    print(f"[lyria] PASS -> {out_wav} ({out_wav.stat().st_size} bytes)")
    return out_wav


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--stem", choices=["01", "02", "03", "04", "all"], default="all")
    ap.add_argument("--project", default=None)
    args = ap.parse_args()

    token, default_project = access_token()
    project = args.project or default_project
    if not project:
        print("[lyria] FAIL: no GCP project", file=sys.stderr)
        return 1

    print(f"[lyria] project={project}")
    targets = list(STEMS) if args.stem == "all" else [args.stem]

    for stem_id in targets:
        try:
            generate_stem(stem_id, project, token)
        except Exception as err:
            print(f"[lyria] FAIL stem {stem_id}: {err}", file=sys.stderr)
            return 1

    print("[lyria] Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
