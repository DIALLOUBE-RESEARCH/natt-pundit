# HANDOFF — Video production Natt Pundit (reprise agent)

> **Lis ce fichier EN ENTIER avant toute action video.**
> **Date snapshot** : 2026-07-13 UTC
> **Owner** : Hamet — tutoiement FR, direct
> **Deadline hackathon** : **2026-07-19 23:59 UTC**
> **Handoff produit parent** : `hackathon/natt-pundit/docs/259_HANDOFF_NATT_PUNDIT_REPRISE_AGENT.md`
> **Skill ref** : `.cursor/skills/nattapp-work-method/SKILL.md` (posture) — pipeline video = creatif + FFmpeg, pas AUDIT/SPEC trading

---

## 0bis. REPRISE IMMEDIATE — etat exact (2026-07-13)

### PLAN MONTAGE AUTO (decision owner — NE PAS OUBLIER)

**Doc recherche** : `00_brief/AUTOMATION_PIPELINE_RESEARCH.md`

**Verdict fige** : montage **80–95% par l'agent**, outils **gratuits**, sans CapCut obligatoire.

```
BEAT_SHEET.md
     ↓
pipeline/manifest.json   ← agent remplit chemins + durees
     ↓
render_from_manifest.py  ← FFmpeg (imageio-ffmpeg, deja dans le repo)
     ↓
05_export/final/natt-pundit_submission_auto.mp4
     ↓
[optionnel 10 min owner] CapCut grade seulement si besoin
```

| Outil GitHub evalue | Role | Decision |
|---------------------|------|----------|
| **FFmpeg + manifest JSON** | EDL, concat, mix audio, 9:16 | **CHOIX PRINCIPAL** — deja code |
| [Editly](https://github.com/mifi/editly) | transitions / titres JSON5 | Plan B si transitions fancy |
| [CutAgent](https://github.com/DaKev/cutagent) | EDL agent-first | reference |
| [mcp-video](https://github.com/KyaniteLabs/mcp-video) | MCP trim/resize/subs | bonus Cursor |
| faster-whisper | sous-titres EN locaux | a brancher si `subtitles.enabled` |

**Toi** : captures scrcpy mobile uniquement (9:16 natif — **pas** OBS/desktop).
**Agent** : manifest + TTS deja fait + `python scripts/render_from_manifest.py` → MP4 final.

**Gap connu (a coder)** : `render_from_manifest.py` = **montage amateur** (1 VO + adelay). Finishing pro = `AUDIO_FINISHING_PRO.md` + `render_audio_timeline.py` (EDL `music_regions` / `vo_regions`, fades, sidechain duck, loudnorm).

---

**Intro ambiance VALIDEE** — owner : « on a enfin notre intro super ».

### Ce qui est DONE (ne pas refaire)

| Asset | Fichier local | Duree | Notes |
|-------|---------------|-------|-------|
| **A1 bar tension** | `02_generative/veo/A1_bar_tension_9x16_silent.mp4` | **8 s** | **LOCK** — ne pas regenerer |
| **A2 stade joie** | `02_generative/veo/A2_stadium_joy_9x16_silent_4s.mp4` | **4 s** | Trim 4 premieres sec (ex-8s). **LOCK** |
| **A3 fan emotion** | `02_generative/veo/A3_fan_face_emotion_9x16_silent.mp4` | **6 s** | **LOCK** |
| **Logo overlay** | `02_generative/intro/logo_intro_9x16_silent.mp4` | **4 s** | A1 + logos fade-in centres |
| **TTS Charon (9 acts)** | `02_generative/tts/01_hook.wav` … `09_close.wav` | — | **NE PAS regenerer** sauf demande owner |
| **Musique Lyria** | `lyria/music_01..04.wav` | ~65s x4 | **v2 DONE** — ref Torch inst., ecoute owner |

**Total Veo ambiance** : 8 + 4 + 6 = **18 s** (+ 4 s logo = **22 s** avant hook VO a 0:26).

### Ce qui reste TODO

| Priorite | Tache | Owner |
|----------|-------|-------|
| **P0** | Captures scrcpy **beat sheet v2** (voir §2) — ordre : fixtures → wallet Reown/Phantom → i18n flash → bet France→claim → proof 18172280 → agent/MCP/Claude | Hamet |
| **P0** | Slides trust (228 tests) + CTA + devnet disclaimer | Agent ou Hamet |
| **Mix audio final** | — | — | **TODO** — `AUDIO_FINISHING_PRO.md` (EDL evenements, J/L-cuts, duck, pas sync naive) |
| **Intro radio mix** | — | — | **TODO** — `render_audio_timeline.py` + `pipeline/audio_timeline.intro.json` |
| **P2** | Grade CapCut (`GRADE.md`) — **optionnel** seulement | Hamet |

### Prochaine action immediate

1. **Hamet** : tournage J-1 — voir **§11 plan capture ce soir**
2. **Demain match** : rush `04_bet_france` post-FT collect seulement (si depot fait ce soir)

### Decision beat sheet v2 (2026-07-13 owner GO)

- Contexte **TxLINE SETUP/HOLD** avant connect wallet
- **Reown AppKit + Phantom** (Solana) — **pas wagmi**
- i18n flash EN→ZH→EN (~15s) — **jour/nuit coupe** (gain temps)
- Bet complet France `18237038` + proof fixture finie `18172280`
- Agent Spain + Claude web MCP avec **1 tool call visible**
- Trust : **228** tests (sous-titre ; VO 07 dit encore 220)

---

## 1. Formule video (source de verite)

```
[0:00 - 0:22]  AMBIANCE WC — Veo Pack A (phones sans ecran visible)
[0:22 - 0:26]  LOGOS — overlay fade (WC Hackathon + Powered by TxODDS)
[0:26 - 5:00]  PREUVE PRODUIT — scrcpy mobile + desktop agent + trust + CTA
```

**Format** : **9:16 vertical** (1080x1920 canvas montage ; rushes Veo actuels en **720x1280** — upscale OK dans `render_from_manifest.py`).

**Regle d'or creative** : jamais d'ecran phone fake en Veo. L'app reelle = **scrcpy uniquement**.

Docs structure : `WC_PITCH_PLAYBOOK.md` | `BEAT_SHEET.md` | `INTRO_STRATEGY.md`

---

## 2. Beat sheet detaille (5:00) — **v2 jury TxLINE**

> Source complete : **`BEAT_SHEET.md`** (timestamps + noms fichiers capture).

| Temps | Scene | Source |
|-------|-------|--------|
| 0:00–0:26 | Intro Veo + logos | LOCK (A1/A2/A3 + logo) |
| 0:26–0:40 | Hook — TxLINE decide le score | TTS `01_hook` |
| 0:40–1:00 | Fixtures **SETUP/HOLD** | scrcpy `01_fixtures_setup_hold` |
| 1:00–1:25 | **Connect Reown → Phantom** | scrcpy `02_wallet_connect_reown_phantom` |
| 1:25–1:40 | Flash i18n EN→ZH→EN | scrcpy `03_polish_i18n_flash` |
| 1:40–2:50 | France bet → keeper → **Collect** | scrcpy `04_bet_france_full_journey` |
| 2:50–3:15 | Proof Merkle match fini `18172280` | scrcpy `05_proof_merkle_finished` |
| 3:15–4:15 | Agent Spain + MCP + **Claude web** 1 tool | scrcpy `06_agent_mcp_claude` |
| 4:30–4:45 | Trust **228 tests** + archi CPI | overlay (sous-titre corrige 220) |
| 4:45–5:00 | CTA repo + 19 juillet | TTS `09_close` |

**Matchs** :
- Live : **`18237038`** France vs Spain — Hamet **home**, agent **away**
- Proof backup : **`18172280`** (deja fini)

**Stack wallet (dire au jury)** : **Reown AppKit + WalletConnect — Solana devnet** (pas wagmi EVM).

**URLs prod** :
- App : https://hypernatt.com/fr/nattpundit?lang=en
- Agent : https://hypernatt.com/fr/nattpundit/agent?lang=en
- MCP : https://hypernatt.com/mcp-pundit/protocol

---

## 3. VO TTS — 9 segments (Charon, Netflix doc)

Script texte : `01_scripts/vo_pitch_draft.md`

| Fichier | Beat sheet | Texte (extrait) |
|---------|------------|-----------------|
| `01_hook.wav` | 0:26–0:36 | The world watches every match… |
| `02_reveal.wav` | 0:36–1:10 | World Cup fixtures. Live odds… |
| `03_stakes.wav` | 1:10–1:50 | Pick your side. Stake devnet USDC… |
| `04_reward.wav` | 1:50–2:30 | Track PnL. Merkle proof… |
| `05_twist.wav` | 2:30–3:15 | Autonomous agent bets on its own… |
| `06_agents.wav` | 3:15–3:45 | Twenty MCP tools… |
| `07_trust.wav` | 4:30–4:45 | Two hundred twenty-eight tests. Keeper settle-only. (**regen 2026-07-13**) |
| `08_architecture.wav` | 4:15–4:30 | Mainnet data from TxLINE… |
| `09_close.wav` | 4:30–5:00 | Natt Settlement. July nineteenth. |

Genere par `scripts/generate_all_tts.py` — voix **Charon**, style `pilot_00-40_vo.txt`.

**Interdit** : regenerer TTS sans ordre owner (couts API + voix validee).

---

## 4. Intro logos — implementation actuelle (2026-07-13)

**Decision owner** : logos **par-dessus la video** (pas slate noir), **centres**, 2 lignes :
1. World Cup Hackathon (`contest-logo.avif`)
2. Powered by + logo TxODDS + wordmark

**Assets branding** (source de verite) :
- `hackathon/natt-pundit/apps/web/public/branding/contest-logo.avif`
- `hackathon/natt-pundit/apps/web/public/branding/txodds-logo.webp`

**Script** : `scripts/build_logo_intro.py`
```powershell
cd hackathon\natt-pundit\video-production
python scripts/build_logo_intro.py
# options: --base, --duration, --fade-in
```

**Technique** :
- Probe resolution video base (A1 = 720x1280)
- Overlay PNG meme taille + `fade=t=in` alpha 1s
- Output : `02_generative/intro/logo_intro_9x16_silent.mp4`

**Piege corrige** : overlay 1080x1920 sur base 720x1280 = logos coupes a droite. Toujours matcher la res de la base.

**Note montage** : `logo_intro` reprend des images A1. En concat, ne pas mettre A1 entier + logo_intro sans decoupe (doublon). Options :
- A1 (4s sans logos) + logo_intro (4s) + A2 + A3, ou
- Overlay logos sur la fin du montage Veo dans CapCut.

---

## 5. Veo Pack A — regles NON NEGOCIABLES

| Regle | Detail |
|-------|--------|
| **Owner gate** | `VEO_OWNER_GATE.md` — jamais `generate_pilot_veo.py` sans **« go veo »** explicite |
| **Clips LOCK** | A1, A2 (4s), A3 — **ne pas regenerer, ecraser, ni restaurer Recycle Bin** |
| **Modele qualite** | `veo-3.1-generate-preview` — fast seulement si owner dit « go fast » |
| **Quota 429** | STOP — pas de boucle API ; attendre owner |
| **Audio Veo** | Toujours utiliser `*_silent_9x16.mp4` (piste audio strippee) |
| **Ecran phone** | **Invisible** en Veo — dos/profil/angle masque |
| **TxODDS maillots** | **Obligatoire** sur fans en Veo (owner) — texte blanc sur maillot bleu |
| **Marques** | Voir `RIGHTS_AND_BRANDS.md` — pas Nike/FIFA/Apple/Samsung |

Prompts valides : `01_scripts/intro_shots/A1_*`, `A2_*`, `A3_*`

Brief signe : `CREATIVE_BRIEF_INTRO.md` — Pack A coche, go veo owner.

---

## 6. Arborescence `video-production/`

| Dossier | Role |
|---------|------|
| `00_brief/` | Beat sheet, playbooks, **ce handoff** |
| `01_scripts/` | Prompts Veo, VO, vo_pitch |
| `02_generative/veo/` | Clips Veo silencieux |
| `02_generative/tts/` | WAV Charon |
| `02_generative/intro/` | Logo overlay MP4 |
| `03_capture/mobile/` | scrcpy (vide — a remplir) |
| `03_capture/desktop/` | OBS / Game Bar (vide) |
| `04_edit/` | Projet CapCut, LUTs |
| `05_export/final/` | Render final |
| `pipeline/manifest.json` | EDL FFmpeg |
| `scripts/` | Automation |

**Git** : `.gitignore` exclut mp4/wav captures — **fichiers media = local owner**, pas commit.

---

## 7. Pipeline technique

### Generatif (agent)

```powershell
cd hackathon\natt-pundit\video-production\scripts
python generate_all_tts.py          # SEULEMENT si owner demande
python generate_pilot_veo.py        # INTERDIT sans go veo
python build_logo_intro.py          # logos overlay
```

Cles : `GOOGLE_AI_API_KEY` ou `gcloud auth application-default login` (local owner).

### Capture mobile (Hamet)

```powershell
.\scripts\scrcpy_record.ps1 -OutName "01_fixtures_core"
```

Pre-requis : `C:\scrcpy\`, USB debug, Phantom devnet, app `?lang=en`.

Checklist : `README.md` section « Checklist before record ».

### Montage auto FFmpeg

```powershell
# Editer pipeline/manifest.json puis :
python scripts/render_from_manifest.py
```

→ `05_export/final/natt-pundit_submission_auto.mp4`

**Etat manifest (2026-07-13)** : **INCOMPLET** — manque segments Veo A1-A3, TTS par act, captures placeholder. A mettre a jour avant render.

### Montage manuel CapCut (finition owner)

- Canvas **9:16** 1080x1920
- Grade : `GRADE.md` (shadows blue-cyan, highlights cool)
- J-cuts, captions EN sur VO
- Detach audio Veo si clip non-silent glisse dans le projet

---

## 8. Index documents (lire selon besoin)

| Fichier | Contenu |
|---------|---------|
| `README.md` | Workflow global, checklist, task split |
| `BEAT_SHEET.md` | Timeline 5:00 |
| `INTRO_STRATEGY.md` | Intro 0:00–0:26 |
| `WC_PITCH_PLAYBOOK.md` | Storyboard ambiance + formule (note : logos « fond noir » = obsolete, voir §4) |
| `CREATIVE_BRIEF_INTRO.md` | Pack A signe, regles phone |
| `RIGHTS_AND_BRANDS.md` | Marques interdites / autorisees |
| `MUSIC_PLAN.md` | Plan mix timeline (duck -15dB, silence logos) |
| `MUSIC_DIRECTION_V2_DILLA.md` | **Direction J Dilla — prompts v2, attente piste reference** |
| `GRADE.md` | Color grade CapCut |
| `VEO_OWNER_GATE.md` | Stop Veo sans go |
| `VEO_PROMPTING.md` | Tips prompts |
| `H4_STOCK_BACKUP.md` | Pack D Pexels si Veo KO |
| `AUTOMATION_PIPELINE_RESEARCH.md` | FFmpeg vs Editly vs CapCut |
| `PILOT_RESULTS.md` | Pilote v1 (16:9 — ignorer sauf lecon silent) |
| `01_scripts/vo_pitch_draft.md` | Script VO complet |
| `docs/SUBMISSION_KIT.md` §5 | Outline jury (angle produit, pas identique beat sheet creatif) |

---

## 9. Pieges agent (lire avant d'agir)

| Piege | Action |
|-------|--------|
| Regenerer A1/A3/A2 | **INTERDIT** — clips valides owner |
| Restaurer vieux Veo Recycle Bin / re-download API | **INTERDIT** (owner) |
| Regenerer TTS | **INTERDIT** sans demande |
| Lancer Lyria sans go | **INTERDIT** — lire `MUSIC_PLAN.md` §8 |
| Overlay logos 1080 sur video 720 | Toujours probe + match res |
| Post-prod logo sur clip Veo (TxODDS shirt) | Owner veut TxODDS **dans** le Veo, pas overlay post |
| Commit mp4/wav | Gitignore — reste local |
| Pousser video avant produit stable | Owner furieux — produit d'abord |
| `generate_pilot_veo.py` sans go | Argent reel — STOP |
| Utiliser clips Veo **avec** audio | Stripper ou utiliser `*_silent_*` |

---

## 11. Plan capture J-1 (ce soir) vs J0 (match)

### Avant de lancer scrcpy

1. Phone : **Options developpeur** → **Depbogage USB** ON
2. Brancher USB → popup phone **Autoriser** ce PC
3. Verifier : `C:\scrcpy\adb.exe devices` → doit afficher un id `device`
4. Phantom : reseau **Devnet** + un peu de SOL + USDC
5. Chrome mobile : https://hypernatt.com/fr/nattpundit?lang=en

### Ce soir (rushs libres)

| # | Commande PowerShell | Action a l'ecran |
|---|---------------------|------------------|
| 1 | `.\scrcpy_record.ps1 -OutName "02_wallet_connect"` | **Deconnecte** → Wallet → Reown → Phantom |
| 2 | `.\scrcpy_record.ps1 -OutName "01_fixtures_setup_hold"` | Matches → scroll SETUP/HOLD |
| 3 | `.\scrcpy_record.ps1 -OutName "03_polish_i18n_flash"` | Header langue EN→ZH→EN |
| 4 | `.\scrcpy_record.ps1 -OutName "05_proof_merkle"` | Match fini `18172280` → proof vert |
| 5 | `.\scrcpy_record.ps1 -OutName "06_agent_mcp_claude"` | `/agent` + CONNECT AGENT |
| 6 | (opt) `04_bet_france_deposit_only` | `18237038` → pari France **avant** FT |

**Ctrl+C** dans le terminal pour arreter chaque rush.

### Demain seulement (match France–Espagne)

| Rush | Quand |
|------|-------|
| `04_bet_france_collect` | Apres FT : Settlement in progress → Collect → Wallet |

Dossier sortie : `03_capture/mobile/`

---

## 10. Journal session

### 2026-07-13 — TTS regen selective (03 + 07, Charon)

- `03_stakes.wav` : wallet Reown/Phantom + pari
- `07_trust.wav` : 228 tests + keeper settle-only
- Commande : `python generate_all_tts.py 03_stakes 07_trust`
- Les 7 autres WAV inchanges

### 2026-07-13 — Beat sheet v2 (owner GO jury TxLINE + fan journey)

- Fusion SUBMISSION_KIT §5 + flow Hamet (wallet Phantom, i18n flash, bet→claim, agent/Claude MCP)
- Coupe jour/nuit ; garde i18n ~15s ; proof fixture 18172280 ; 228 tests sous-titre
- `BEAT_SHEET.md` reecrit — 8 fichiers capture nommes dans `03_capture/mobile/`

### 2026-07-13 — Lyria v2 (ref You Can't Hold A Torch)

- Ref : https://www.youtube.com/watch?v=p7P0GtJJG_0 — 95 BPM soul boom bap
- v1 cinematic **rejet** ; v2 prompts sans nom artiste (filtre Lyria sur « J Dilla »)
- 4 stems regen **PASS** — ecouter surtout `music_02_demo.wav`
- Suite : validation owner → mix multi-stems duck -15dB

### 2026-07-13 — Lyria v1 (Option B cinematic — rejet owner)

### 2026-07-13 — Intro logos overlay + handoff video

- Owner : TTS deja fait — ne pas toucher `02_generative/tts/`
- Logos : overlay sur A1 centre 2 lignes (WC Hackathon + Powered by TxODDS), fade-in 1s
- Fix scale : overlay 720x1280 (match A1), logos reduits (max 80% largeur)
- Owner valide intro : **DONE**
- Cree : `HANDOFF_VIDEO_REPRISE_AGENT.md` (ce fichier)
- `manifest.json` : duration logo 4s, note overlay — **segments Veo pas encore ajoutes**

### 2026-07-12 — Veo Pack A + TTS batch

- A1/A2/A3 generes, maillots TxODDS, ecrans caches
- `generate_all_tts.py` → 9 WAV Charon PASS
- Playbook human-first : `WC_PITCH_PLAYBOOK.md`, `RIGHTS_AND_BRANDS.md`

---

*Derniere MAJ : 2026-07-13 — intro validee owner ; prochaine etape = scrcpy + manifest + montage 5:00.*
