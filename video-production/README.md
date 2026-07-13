# Natt Pundit — Video production (hackathon submission)

**Deadline:** 2026-07-19  
**Target format:** **9:16 vertical mobile** (TikTok/Reels/phone fullscreen) — NOT 16:9.  
**Prod app:** https://hypernatt.com/fr/nattpundit?lang=en  
**Agent dashboard:** https://hypernatt.com/fr/nattpundit/agent?lang=en

---

## Reprise agent

**Handoff video (lis en premier)** : `00_brief/HANDOFF_VIDEO_REPRISE_AGENT.md`

---

| Path | Purpose |
|------|---------|
| `00_brief/` | Beat sheet, VO facts, roles (France vs Spain), grade notes |
| `01_scripts/` | Prompts Veo / Lyria / VO (copy-paste ready) |
| `02_generative/` | GCP outputs — `veo/`, `tts/`, `lyria/` |
| `03_capture/` | scrcpy mobile + desktop screen recordings |
| `04_edit/` | CapCut project exports, LUT, notes de montage |
| `05_export/` | Renders intermediaires + `final/` |
| `pipeline/` | `manifest.json` — EDL montage auto FFmpeg |
| `scripts/` | Automation (TTS, render, scrcpy helpers) |

---

## Roles (match day — France vs Spain `18237038`)

| Who | Surface | Action |
|-----|---------|--------|
| **Hamet** | Mobile (scrcpy) | Bet **France (home)** |
| **Natt Agent CDP** | `/agent` dashboard | Bet **Spain (away)** — script VPS en coulisse |
| **Jury sees** | `/agent?lang=en` | Ledger + balances (read-only proof) |

---

## Workflow

### 1. Generative (Cursor + GCP)

```powershell
cd hackathon\natt-pundit\video-production\scripts
python generate_pilot_tts.py          # VO pilote 0:20-0:40
python generate_pilot_veo.py          # Veo cold open (async, long)
.\generate_pilot_lyria.ps1            # Musique pilote Lyria
```

Requires: `GOOGLE_AI_API_KEY` or `gcloud auth application-default login`.

### 2. Mobile capture (Hamet) — **100% scrcpy 9:16**

Voir `00_brief/MOBILE_CAPTURE_AGENT_MCP.md` — **pas** OBS/desktop.

1. Phone: USB debugging ON, cable to PC.
2. App `?lang=en` — onglet Matches, Wallet, `/agent`, **CONNECT AGENT**.
3. Run:

```powershell
.\scripts\scrcpy_record.ps1 -OutName "01_fixtures_core"
```

Outputs → `03_capture/mobile/` only.

### 4. Montage auto (agent — gratuit FFmpeg)

```powershell
cd hackathon\natt-pundit\video-production\scripts
copy ..\pipeline\manifest.example.json ..\pipeline\manifest.json
# edit manifest.json — paths scrcpy reels
python render_from_manifest.py
```

→ `05_export/final/natt-pundit_submission_auto.mp4`

Voir `00_brief/AUTOMATION_PIPELINE_RESEARCH.md` pour outils GitHub (Editly, CutAgent, mcp-video).

### 5. Montage manuel (Hamet — CapCut optionnel)

- Grade: shadows blue-cyan, highlights cool neutral (see `00_brief/GRADE.md`)
- J-cuts, alternate calm / fast cuts
- EN auto-captions on final VO track
- Import LUT `.cube` if needed → `04_edit/luts/`

### 5. Export final

`05_export/final/natt-pundit_submission_YYYYMMDD.mp4`

---

## Checklist before record

- [ ] Agent wallet funded (10 USDC + ~0.017 SOL devnet)
- [ ] Phantom devnet funded (France bet)
- [ ] `adb devices` shows phone
- [ ] App URL `?lang=en` for jury-facing UI
- [ ] Pilot TTS + (optional) Veo in `02_generative/`

---

## Task split

| Task | Owner |
|------|-------|
| scrcpy install + scripts | Cursor |
| Mobile capture (fixtures, agent, MCP) | Hamet |
| Veo / TTS / Lyria API | Cursor |
| CapCut montage + grade | Hamet |
