# Recherche — montage video 100% automatise (gratuit)

**Question:** est-ce qu'on peut tout monter nous-memes / l'agent realise la video via pipeline pro gratuit ?

**Reponse courte:** **OUI pour 80–95%** (assemblage, VO, musique, sous-titres, 9:16, logos). **NON pour le 5–20%** creatif (rythme J-cut, grade fin, retakes scrcpy) — sauf si tu valides un render auto puis 1 passe CapCut.

---

## Ce qu'on a DEJA (zero nouvel outil)

| Asset | Source | Automatisable |
|-------|--------|---------------|
| Logo intro 2s | `build_logo_intro.py` | OUI |
| VO Charon | `generate_pilot_tts.py` + Gemini API | OUI (payant API, pas CapCut) |
| Captures app | scrcpy → `03_capture/mobile/` | Semi (toi branches tel) |
| Desktop `/agent` | OBS / Game Bar | Semi |
| Musique | Lyria Vertex ou stock libre | OUI si API OK |
| Veo B-roll | **OPTIONNEL** — coute cher, qualite aleatoire | Eviter |

**Moteur de rendu deja present:** `imageio-ffmpeg` (bundled ffmpeg) dans les scripts Python.

---

## Outils gratuits / open source (cartographie juillet 2026)

### Tier A — recommande pour Natt Pundit (agent + Windows)

| Outil | Stars / statut | Role | Fit |
|-------|----------------|------|-----|
| **FFmpeg + manifest JSON** (custom) | On controle tout | EDL, concat, mix audio, 9:16 | **MEILLEUR** pour demo hackathon deterministe |
| **Editly** | ~5.4k GitHub, MIT | JSON5 → video, transitions, titres, sous-titres | Tres bon si Node deja la |
| **CutAgent** | v0.6 juil 2026, MIT | EDL JSON agent-first, sortie structuree | Bon pour Cursor/agent |
| **mcp-video** | MCP server 2026 | Pipeline FFmpeg en tools MCP | Interessant dans Cursor |
| **faster-whisper** | local gratuit | Sous-titres EN word-timed → ASS | Pour captions CapCut-style |

### Tier B — utile pour sections specifiques

| Outil | Role | Note |
|-------|------|------|
| **Remotion** | Motion graphics React (archi animée) | Lourd a setup; ffmpeg inclus; licence partielle |
| **Montaj** | CLI agent-native (workflows) | Beta, macOS brew focus, plus complexe |
| **videopython** | Python lib + MCP auto-edit | Vision LLM local (Ollama) — overkill |
| **agentic-video-editor** | Gemini choisit les plans | Besoin beaucoup de rushes + API |

### Tier C — pipelines "YouTube Short" generiques

| Outil | Limite pour nous |
|-------|------------------|
| ffmpeg-ai, AutoVidNarrator, Pilipili | Orientes contenu generique / CN / Shorts IA — pas notre beat sheet produit |
| CapCut API | Pas d'API publique propre — montage manuel reste la finition |

---

## Architecture pipeline recommandee (gratuit + agent Cursor)

```
[Beat sheet BEAT_SHEET.md]
        ↓
[manifest.json]  ← agent remplit chemins + durees apres captures
        ↓
┌───────────────────────────────────────┐
│ render_from_manifest.py (FFmpeg)      │
│  - scale/crop 1080x1920               │
│  - concat segments                    │
│  - mix: VO + music (duck -12dB)       │
│  - optional: whisper → ASS burn-in    │
└───────────────────────────────────────┘
        ↓
05_export/final/natt-pundit_submission.mp4
        ↓
[Optionnel 10 min Hamet] CapCut grade + 1 J-cut
```

### Division du travail

| Etape | Qui | Automatisable |
|-------|-----|---------------|
| Captures scrcpy | Hamet (USB) | Non |
| Remplir manifest (chemins clips) | **Agent** | Oui |
| Logo intro | **Agent** | Oui (`build_logo_intro.py`) |
| VO segments | **Agent** | Oui (scripts TTS existants) |
| Render MP4 | **Agent** | Oui (`render_from_manifest.py`) |
| Sous-titres EN | **Agent** | Oui (whisper local) |
| Grade / polish final | Hamet | Partiel (LUT preset dans manifest) |

---

## Editly vs FFmpeg pur (decision)

| Critere | FFmpeg manifest | Editly JSON5 |
|---------|-----------------|--------------|
| Deps | Python + imageio-ffmpeg (deja la) | Node + ffmpeg system PATH |
| Transitions | xfade basique | riches (fade, crosszoom…) |
| Titres / logos | overlay filter ou clip dedie | layer `title` / `image` |
| Agent-friendly | JSON simple | JSON5 + gros README |
| Windows | OK | OK (headless-gl parfois chiant) |

**Verdict:** commencer **FFmpeg manifest** dans le repo (zero surprise). Si transitions fancy needed → ajouter Editly en option.

---

## mcp-video dans Cursor (bonus)

Repo: `KyaniteLabs/mcp-video` — MCP server avec tools `trim`, `resize 9:16`, `subtitles`, `pipeline` JSON.

Permettrait a un agent Cursor de monter sans scripts custom — **a evaluer** si tu veux l'ajouter aux MCP user (comme natt-pundit).

---

## Ce qu'on ne automatise PAS (honnête)

1. **Qualite creative Veo** — aleatoire, couteux
2. **Premier take scrcpy** — doigts, notifications, lag
3. **Synchronisation parfaite agent deposit + refresh dashboard** — timing humain
4. **Grade CapCut "Netflix"** — subjectif; preset ffmpeg `eq` possible mais limite

---

## Plan d'action concret (prochaine session)

1. Tu captures les rushes scrcpy (checklist beat sheet)
2. Agent genere toutes les VO (1 fichier par segment)
3. Agent remplit `pipeline/manifest.json`
4. `python scripts/render_from_manifest.py` → export final
5. Tu regardes 1x — si OK submit, sinon tweak manifest (pas refilm tout)

**Cout API restant:** TTS Gemini seulement (pas Veo sauf go explicite).

---

## Liens utiles

- Editly: https://github.com/mifi/editly
- CutAgent: https://github.com/DaKev/cutagent
- mcp-video: https://github.com/KyaniteLabs/mcp-video
- Montaj: https://github.com/theSamPadilla/montaj
- Remotion: https://www.remotion.dev
- FFmpeg concat: https://ffmpeg.org/ffmpeg-formats.html#concat
