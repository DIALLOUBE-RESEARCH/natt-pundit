# Plan musique — video 5:00 Natt Pundit

> **STATUT : STEMS GENERES 2026-07-13 — Option B, 4 fichiers dans `02_generative/lyria/`.**
> **Skill ref** : ne pas lancer `generate_music_stems.ps1` sans **« go lyria »** explicite.
> **Handoff video** : `HANDOFF_VIDEO_REPRISE_AGENT.md`

---

## 0. Decisions owner FIGEES

| Parametre | Choix |
|-----------|-------|
| **Style** | **Option B** — stadium emotion + synth sous-couche |
| **Stems** | **4** (`music_01_intro` … `music_04_outro`) |
| **Duck sous VO** | **-15 dB** |
| **Silence logos** | **0:22–0:26** — fade musique intro a `—` avant hook Charon |

Prompts JSON : `01_scripts/lyria_01_intro.json` … `lyria_04_outro.json`  
Runner : `scripts/generate_music_stems.ps1 -Stem all`

---

## 1. Etat actuel

| Element | Statut |
|---------|--------|
| Musique generee | **DONE** — `music_01_intro.wav` … `music_04_outro.wav` (~32.8s chacun, 48kHz) |
| Script Lyria pilote | `01_scripts/pilot_00-40_lyria.json` (40s, style docu tech) |
| Runner | `scripts/generate_pilot_lyria.ps1` (Vertex **lyria-002**, `gcloud auth` + billing) |
| Manifest | `music: null`, `music_volume: 0.15` (placeholder) |
| VO Charon | **DONE** — 9 WAV, ~110s total voix pure |

**Conclusion** : la couche musique est a **zero**. Tout le mix musical reste a concevoir + generer.

---

## 2. Principe de mix (3 etats)

Chaque seconde de la timeline est dans **un seul** de ces etats :

| Etat | Symbole | Regle |
|------|---------|-------|
| **Musique seule** | `M` | Bed audible, pas de VO. Niveau reference **0 dB relatif** (base mix). |
| **Musique sous VO** | `M+VO` | Meme bed **ducke** sous la voix Charon. Cible **-12 a -18 dB** vs musique seule (manifest actuel : 15% = ~-16 dB). |
| **Silence / room tone** | `—` | Pas de musique (ou fade < -40 dB). UI scrcpy, chiffres, ou respiration avant VO. |

**Regles non negociables proposees :**

1. **Jamais** musique au meme niveau sous VO que en `M` — toujours duck.
2. **Hook VO (0:26)** : playbook WC dit « silence soudain » avant Charon → **fade musique intro a `—` sur 0:20–0:26**, puis bed entre en `M+VO` sous le hook.
3. **Plans scrcpy detail** (tap Parier, Merkle, wallet) : preferer `M` ou `M+VO` leger — **pas** de drop complet sauf si VO parle.
4. **Close (4:30–5:00)** : `M+VO` puis swell `M` seul sur les 2–3 dernieres sec apres la derniere phrase.

---

## 3. Timeline proposee (alignee beat sheet + durees TTS mesurees)

Durees VO reelles (mesure 2026-07-13) :

| Fichier | Duree reelle |
|---------|--------------|
| `01_hook.wav` | 11.2 s |
| `02_reveal.wav` | 13.3 s |
| `03_stakes.wav` | 11.3 s |
| `04_reward.wav` | 11.1 s |
| `05_twist.wav` | 12.9 s |
| `06_agents.wav` | 11.1 s |
| `07_trust.wav` | 12.6 s |
| `08_architecture.wav` | 9.2 s |
| `09_close.wav` | 18.0 s |

### Carte audio (proposition v1)

| Temps video | Visuel | Audio etat | Musique (intention) |
|-------------|--------|------------|---------------------|
| **0:00–0:08** | A1 bar tension | `M` | Pad sparse, tension basse, intensity 2/10 |
| **0:08–0:12** | A2 joie stade | `M` | Montee courte, pulse 4/10 (pas de drums lourds) |
| **0:12–0:18** | A3 emotion | `M` | Ligne melodique legere, 5/10 |
| **0:18–0:22** | marge / hold plan | `M` → fade | Redescente vers 2/10 |
| **0:22–0:26** | logos fade | `—` | **Fade out musique** — espace avant VO (playbook) |
| **0:26–0:37** | debut scrcpy + hook | `M+VO` | Bed docu entre, duck sous `01_hook` |
| **0:37–0:50** | fixtures (reveal VO) | `M+VO` | meme bed, `02_reveal` |
| **0:50–1:02** | fixtures suite | `M` | **respiration** — musique seule entre deux VO si montage le permet |
| **1:02–1:13** | pari France setup | `M+VO` | `03_stakes` |
| **1:13–1:35** | pari France action | `M` | tension legere, pas de VO |
| **1:35–1:46** | wallet / reward VO | `M+VO` | `04_reward` |
| **1:46–2:05** | collect / PnL | `M` | bed stable, UI au premier plan |
| **2:05–2:18** | agent twist VO | `M+VO` | `05_twist` |
| **2:18–2:45** | dashboard agent | `M` | bed tech, un peu plus present |
| **2:45–2:56** | MCP VO | `M+VO` | `06_agents` |
| **2:56–3:15** | MCP demo | `M` | |
| **3:15–3:28** | trust VO | `M+VO` | `07_trust` |
| **3:28–3:45** | tests overlay | `M` ou `—` | **option silence** pour lisibilite chiffres |
| **3:45–3:54** | archi VO | `M+VO` | `08_architecture` |
| **3:54–4:12** | slide archi | `M` | |
| **4:12–4:30** | close VO | `M+VO` | `09_close` (long) |
| **4:30–5:00** | CTA slate | `M` → fade out | swell final puis fin |

> Les timestamps VO glissent selon longueur reels scrcpy — le manifest final alignera VO + duck par segment, pas des timecodes fixes a la seconde.

---

## 4. Choix de style — A VALIDER PAR OWNER

Une seule direction a locker avant d'ecrire les prompts Lyria.

### Option A — **Netflix tech documentary** (defaut pilote actuel)

- Analog synth pad, sub pulse minimal, **pas** de batterie ni cordes
- Coherent avec voix Charon
- Prompt deja esquisse dans `pilot_00-40_lyria.json`
- **Risque** : peut sonner « froid » sur plans stade WC

### Option B — **Stadium emotion + synth sous-couche**

- Meme base synth docu + **texture tres basse** foule / air stade (pas sample identifiable)
- Plus aligne `WC_PITCH_PLAYBOOK` (« musique orchestrale » en A3) sans vraies cordes
- **Risque** : texture foule mal generee = bruit cheap

### Option C — **Minimal quasi-silence**

- Musique seulement intro 0:00–0:22 + outro 4:30–5:00 ; reste `—` ou bed -24 dB
- Maximum clarte UI / VO
- **Risque** : moins « cinematic » pour jury hackathon

### Option D — **Hybride Lyria + stock libre**

- Lyria : intro + outro seulement (2 x ~30 s)
- Milieu : loop stock royalty-free (Pixabay / YouTube Audio Library) docu neutre
- **Risque** : coherence timbrale entre Lyria et stock

**Recommandation agent (sans imposer)** : **Option A** pour le corps + **renfort Option B** sur le stem `intro_ambiance` uniquement. Valider avec toi.

---

## 5. Strategie technique Lyria (duree 5:00)

Lyria-002 via Vertex genere des **clips courts** (~30–40 s typiques). Pas un fichier 5 min d'un coup.

### Approche retenue (pipeline auto)

Generer **4 stems** separes, concat + crossfade dans `render_from_manifest.py` :

| Stem ID | Cible | Duree gen | Fichier prevu |
|---------|-------|-----------|---------------|
| `music_01_intro` | 0:00–0:26 ambiance WC | ~30 s prompt structure | `02_generative/lyria/music_01_intro.wav` |
| `music_02_demo` | bed scrcpy mobile | ~30–45 s | `music_02_demo.wav` |
| `music_03_agent` | bed desktop / MCP | ~30 s | `music_03_agent.wav` |
| `music_04_outro` | CTA + swell fin | ~25 s | `music_04_outro.wav` |

Entre stems : crossfade **2 s** en FFmpeg. Milieu demo : **loop** du stem `02` si reel scrcpy > 45 s (avec EQ pour eviter seam audible).

**Alternative economique** : 1 seul stem `02` looper sur toute la video sauf intro/outro — moins riche mais 1 appel API.

---

## 6. Prompts Lyria (brouillon — PAS ENCORE LANCES)

Fichiers a creer apres choix style owner :

| Fichier | Quand |
|---------|-------|
| `01_scripts/lyria_01_intro.json` | apres go |
| `01_scripts/lyria_02_demo.json` | apres go |
| `01_scripts/lyria_03_agent.json` | apres go |
| `01_scripts/lyria_04_outro.json` | apres go |

Negative prompt commun propose :
`vocals, voice, choir, lyrics, heavy drums, cymbals, EDM drop, trap, upbeat corporate, ukulele, whistling`

---

## 7. Integration manifest (a coder apres stems)

Extension `pipeline/manifest.json` prevue :

```json
"audio": {
  "music_stems": [
    { "file": "../02_generative/lyria/music_01_intro.wav", "start_sec": 0, "end_sec": 26, "volume": 1.0 },
    { "file": "../02_generative/lyria/music_02_demo.wav", "start_sec": 26, "loop": true, "volume": 0.35, "duck_under_vo": true },
    ...
  ],
  "voiceover_tracks": [ ... 9 segments avec start_sec ... ],
  "duck_db": -14
}
```

`render_from_manifest.py` : mix multi-piste + sidechain duck quand VO present (a implementer).

---

## 8. Gate owner — checklist avant generation

- [x] **Style** : **B** (stadium + synth)
- [x] **Silence logos 0:22–0:26** : oui
- [x] **Stem strategy** : 4 stems
- [x] **Niveau duck sous VO** : **-15 dB**
- [ ] **Zone tests 3:28–3:45** : musique `M` ou silence `—` (non tranche)
- [x] **Go explicite** : « go lyria » — **DONE 2026-07-13**
- [x] **Projet GCP** : `project-87fea829-0a41-452e-a91` (ADC local)

**INTERDIT agent** : lancer `generate_music_stems.ps1` avant « go lyria » + projet GCP confirme.

---

## 9. Prochaine etape (apres ton OK)

1. Tu choisis style + gates §8
2. Agent redige prompts JSON finaux (1 fichier par stem)
3. Tu dis **go lyria** → generation VPS ou local (`gcloud auth`)
4. Agent etend `render_from_manifest.py` (multi-VO + multi-music + duck)
5. Test mix intro seule (0:00–0:40) avant full 5:00

---

*Cree 2026-07-13 — brouillon plan musique, zero generation lancee.*
