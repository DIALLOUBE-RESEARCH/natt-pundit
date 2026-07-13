# Finishing audio pro — recherche & architecture (anti-montage amateur)

> **STATUT** : recherche owner 2026-07-13 — **ne pas render final** avec `render_from_manifest.py` tel quel.
> **Piste owner** : toutes les pistes + placement intelligent musique/VO (entrees, sorties, respirations) — pas « coller un son synchro video ».
> **Refs** : `MUSIC_PLAN.md`, `BEAT_SHEET.md`, `AUTOMATION_PIPELINE_RESEARCH.md`

---

## 1. Diagnostic — pourquoi le renderer actuel = amateur

`scripts/render_from_manifest.py` aujourd'hui :

| Ce qu'il fait | Probleme |
|---------------|----------|
| Concat video segments (trim fixe) | OK pour video |
| **1 seul** fichier VO + `adelay` global | Ignore les 9 acts TTS |
| **Zero** musique dans le mix | Lyria v2 inutilise |
| Pas de fade in/out | Coupes brutales |
| Pas de duck dynamique | Niveau fixe ou rien |
| Pas de J-cut / L-cut audio | Transitions video = transitions audio (amateur) |
| `shortest` sur mux | Tronque si desalignement |

**Verdict** : outil de **preuve technique** (smoke concat), pas de **finishing jury**.

---

## 2. Ce que fait un montage pro (docu + demo produit)

Sources : guides documentary (LesFM), Adobe/BorisFX J-L cuts, pipelines FFmpeg sidechain (VidNo, podcast-splicing), OpenScript EDL multi-pistes.

### 2.1 Principe central : **l'audio mene, la video suit**

En pro, on ne « met la musique sur la video ». On construit une **timeline audio** (spotting session) :

1. Ou la musique **commence** (souvent **avant** le cut video = **J-cut**)
2. Ou elle **s'arrete** ou **descend** (fade out, pas stop sec sauf intention)
3. Ou la VO **entre** (souvent **apres** 0.3–0.8s de bed reduit = respiration)
4. Ou la VO **sort** (L-cut : musique reste 1–2s pour laisser respirer l'emotion)
5. Entre deux VO : **M** (musique seule) ou **M leger** — jamais silence total sauf logos / chiffres

### 2.2 Les 3 techniques qui evitent le cote YouTube cheap

| Technique | Effet | Exemple Natt |
|-----------|-------|--------------|
| **J-cut audio** | Audio du plan suivant avant l'image | Bed `music_02` monte **0.5s avant** cut Veo → scrcpy |
| **L-cut audio** | Audio du plan precedent apres l'image | Fin hook VO : Charon finit, bed Dilla **reste 1.5s** sur UI |
| **Duck sidechain** | Musique baisse **quand** la voix parle, remonte **entre** les phrases | -15 dB dynamique, pas volume fixe 15% |

### 2.3 Regles documentary (applicables hackathon)

- **Musique sous parole** : clarte dialogue > bed (duck 12–18 dB)
- **Musique seule** : plans sans VO = le bed porte l'emotion (scrcpy taps, scroll)
- **Pas de wall of sound** : 1 stem actif a la fois (crossfade 1–2s entre stems)
- **Silence = choix** : logos 0:22–0:26, peut-etre tests F95N — pas par accident
- **Loudness final** : -16 LUFS integre (YouTube/mobile), true peak -1.5 dBTP

---

## 3. Inventaire pistes — etat 2026-07-13

### Video (pret ou partiel)

| Piste | Fichiers | Pret ? |
|-------|----------|--------|
| Veo intro | A1 8s, A2 4s, A3 6s | **OUI** |
| Logos overlay | logo_intro 4s | **OUI** |
| scrcpy mobile | 03_capture/mobile/ | **NON** — owner |
| desktop agent | 03_capture/desktop/ | **NON** — owner |
| slides / overlay tests | — | **NON** |

### Audio (pret)

| Piste | Fichiers | Duree mesuree |
|-------|----------|---------------|
| Musique stem 01 intro | `lyria/music_01_intro.wav` | ~65.5s (trim a ~26s utilisable) |
| Musique stem 02 demo | `lyria/music_02_demo.wav` | ~65.5s (loop) |
| Musique stem 03 agent | `lyria/music_03_agent.wav` | ~65.5s |
| Musique stem 04 outro | `lyria/music_04_outro.wav` | ~65.5s |
| VO 01–09 Charon | `tts/01_hook.wav` … `09_close.wav` | ~110s total |

**Conclusion owner** : on a assez pour un **finishing pro de l'intro (0:00–0:40)** + **radio edit** des VO — mais le **film 5:00 final** necessite les rushes scrcpy pour caler les **in/out** VO sur l'action reelle.

---

## 4. Architecture cible — `audio_timeline.json` (EDL audio v2)

Separer **video manifest** et **audio timeline** (pattern OpenScript / CutAgent).

```json
{
  "version": 2,
  "sample_rate": 48000,
  "total_duration_sec": null,
  "music_regions": [
    {
      "id": "intro_bed",
      "file": "../02_generative/lyria/music_01_intro.wav",
      "start_sec": 0.0,
      "end_sec": 22.0,
      "source_trim_start": 0.0,
      "fade_in_ms": 800,
      "fade_out_ms": 1200,
      "gain_db": 0
    },
    {
      "id": "silence_logos",
      "start_sec": 22.0,
      "end_sec": 26.0,
      "gain_db": -80
    },
    {
      "id": "demo_bed",
      "file": "../02_generative/lyria/music_02_demo.wav",
      "start_sec": 25.5,
      "end_sec": null,
      "fade_in_ms": 500,
      "loop": true,
      "gain_db": 0,
      "note": "J-cut: bed entre 0.5s AVANT hook VO a 26s"
    }
  ],
  "vo_regions": [
    {
      "id": "hook",
      "file": "../02_generative/tts/01_hook.wav",
      "start_sec": 26.0,
      "fade_in_ms": 100,
      "fade_out_ms": 300,
      "pad_after_sec": 1.2,
      "duck_music_db": -15
    }
  ],
  "duck": {
    "mode": "sidechain",
    "ratio": 8,
    "attack_ms": 20,
    "release_ms": 400,
    "threshold": 0.03
  },
  "master": {
    "loudnorm_I": -16,
    "loudnorm_TP": -1.5
  }
}
```

### Evenements intelligents (pas juste des fichiers)

Chaque region a :

- `start_sec` / `end_sec` (ou `until_next_vo`)
- `fade_in_ms` / `fade_out_ms` (courbes, pas coupes)
- `gain_db` relatif
- `duck_music_db` quand VO active (ou sidechain auto)
- `pad_before_sec` / `pad_after_sec` (respiration)
- `crossfade_to` (stem suivant)

---

## 5. Workflow finishing en 3 passes (pro)

```
PASSE A — Spotting (agent + owner, SANS render)
  Beat sheet + durees reels scrcpy mesurees
  → audio_timeline.json (evenements)
  → owner valide a l'oreille sur timeline texte

PASSE B — Radio mix (toutes pistes audio, video noire ou intro seule)
  Mixer musique + 9 VO seuls → intro_radio.wav + full_radio.wav
  Valider : J-cuts, silences, duck, pas de collision
  OUTIL : render_audio_timeline.py (a coder)

PASSE C — Lock picture + mux final
  Video concat definitive
  Mux video + master_audio.wav
  Loudness check -16 LUFS
```

**Pourquoi radio d'abord** : tu entends le mix **sans** dependre du montage video amateur. Les pros font souvent un « pre-mix » VO+music avant picture lock.

---

## 6. Techniques FFmpeg (implementation future)

| Besoin | Filtre FFmpeg |
|--------|---------------|
| Fade in/out musique | `afade=t=in/out` |
| Crossfade entre stems | `acrossfade` |
| Delay VO a timestamp | `adelay` par segment |
| Duck dynamique sous VO | `sidechaincompress` (VO = sidechain) |
| Loop bed demo | `aloop` ou `stream_loop` |
| Trim stem intro a 26s | `-ss` / `atrim` |
| Mix N pistes | `amix` avec `duration=longest` |
| Loudness YouTube | `loudnorm=I=-16:TP=-1.5` |

Exemple sidechain (pipeline podcast) :

```bash
ffmpeg -i spoken.wav -i bed_music.wav -filter_complex "\
[1:a]volume=0.4[bg];\
[bg][0:a]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[ducked];\
[0:a][ducked]amix=inputs=2:duration=first,loudnorm=I=-16:TP=-1.5" final.wav
```

---

## 7. Carte evenements intro (0:00–0:40) — draft intelligent

Mesure reelle : intro video = 18s Veo + 4s logos = 22s avant VO. Hook VO = 11.2s.

| Time | Video | Musique | VO | Technique |
|------|-------|---------|-----|-----------|
| 0:00 | A1 | stem01 fade in 0.8s | — | M |
| 0:08 | A2 | stem01 continue | — | M |
| 0:12 | A3 | stem01 | — | M |
| 0:18 | hold | stem01 fade out commence | — | M → fade |
| 0:22 | logos | **silence** (-80dB) | — | — owner |
| 0:25.5 | logos/scrcpy | stem02 **J-cut** fade in 0.5s | — | bed avant image |
| 0:26.0 | scrcpy | stem02 duck | **01_hook** | M+VO sidechain |
| 0:37.2 | scrcpy | stem02 **L-cut** 1.2s apres VO | hook fini | respiration |

Pas de 2e VO tant que le plan fixtures n'est pas filme — **start_sec du reveal** = apres mesure du rush scrcpy.

---

## 8. Outils GitHub utiles (reference, pas migration obligatoire)

| Outil | Apport pour nous |
|-------|------------------|
| **FFmpeg + audio_timeline.json** | Controle total, gratuit — **recommande** |
| [OpenScript](https://github.com/ishan-parihar/openscript) | EDL 6 pistes, ducking plan, MCP — modele architecture |
| [CutAgent](https://github.com/DaKev/cutagent) | EDL agent-first JSON |
| Editly | Transitions video + titres — complement |
| Premiere Essential Sound | Reference comportement duck auto |

On **garde** FFmpeg maison mais on **copie** le modele EDL evenementiel d'OpenScript (music_regions + vo_regions + duck).

---

## 9. Ce qu'il faut AVANT render final pro

| Prerequis | Qui |
|-----------|-----|
| Rushes scrcpy + desktop (durees reelles) | Owner |
| `audio_timeline.json` complet (spotting) | Agent + validation owner |
| `render_audio_timeline.py` (mix multi-piste) | Agent — **a coder** |
| Radio mix PASS (oreille) | Owner |
| Video concat lock | Agent |
| Mux final + loudnorm | Agent |

**On PEUT faire maintenant** sans scrcpy :

- Intro **0:00–0:40** radio mix (Veo + logos + hook VO + stems 01/02)
- Template `audio_timeline.json` + script mixer

**On NE PEUT PAS** faire pro sur les VO 02–09 sans savoir **ou** ils tombent sur l'action (tap Parier, Merkle, etc.).

---

## 10. Anti-patterns a bannir

| Amateur | Pro |
|---------|-----|
| 1 WAV VO sur toute la video | 9 regions VO positionnees + pads |
| Musique loop full volume | Duck sidechain + fades |
| Musique start = cut video | J-cut 0.3–0.8s avant |
| VO stop = musique stop | L-cut 1–2s apres |
| Meme stem 5 min | 4 stems + crossfades aux act breaks |
| Pas de silence logos | Fade out + 4s silence owner |
| Render une fois et pray | Radio mix → valider → picture lock |

---

## 11. Prochaine etape proposee

1. **Owner** : OK sur architecture §4–5 (EDL audio separe + 3 passes)
2. **Agent** : coder `pipeline/audio_timeline.intro.json` + `render_audio_timeline.py`
3. **Agent** : produire **intro_radio_mix.wav** (0:00–0:40) pour validation oreille
4. **Owner** : scrcpy → mesurer durees → completer timeline VO 02–09
5. **Agent** : full radio mix → puis mux video

**INTERDIT** : appeler `render_from_manifest.py` « final jury » sans passe radio.

---

*Recherche 2026-07-13 — documentary finishing, J/L cuts, FFmpeg sidechain, OpenScript EDL pattern.*
