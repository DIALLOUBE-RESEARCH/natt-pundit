# SHOT LOG — captures mobile (source de verite montage + TTS v2)

> **Date** : 2026-07-16  
> **Methode** : ffmpeg 1 frame / 3s → lecture visuelle agent → a valider owner (FR) avant regen TTS.  
> **Regle** : aucun nouveau WAV tant que cette fiche n'est pas OK.  
> **Source montage / TTS / subs** : fichiers dans `03_capture/mobile/trimmed/` (specs `TRIM_SPECS.json`).

---

## Coupes owner appliquees (2026-07-16)

Script : `scripts/trim_mobile_captures.py` → sortie `03_capture/mobile/trimmed/`.

| ID | Label | Brut | Coupe | Fichier montage |
|----|-------|------|-------|-----------------|
| C | 03 Polish i18n | 21.1 s | **00:00–00:15** | `trimmed/03_polish_i18n_flash_15s.mp4` (15.0 s) |
| — | 04 Agence Spain | 17.1 s | **00:00–00:10** | `trimmed/04_agent_spain_counterbet_10s.mp4` (10.0 s) |
| D | 04 Bet France | 69.2 s | **00:00–00:55** | `trimmed/04_bet_france_vs_spain_55s.mp4` (55.0 s) |
| E | 04 Bet France Collect | 36.7 s | **00:00–00:33** | `trimmed/04_bet_france_collect_33s.mp4` (33.1 s) |

Rushes **bruts** conserves dans `03_capture/mobile/` (archive). **Ne pas** utiliser les bruts en montage final pour ces 4 clips.

---

## Inventaire fichiers (durees mesurees)

| Fichier | Duree brute | Montage (trim) | Garder ? | Verdict |
|---------|-------------|----------------|----------|---------|
| `01_fixtures_setup_hold_20260713_203705_23s.mp4` | **23.0 s** | 23 s | **OUI** | Take officiel fixtures (seul fichier 01) |
| `03_polish_i18n_flash_21s.mp4` | 21.1 s | **15 s** | **OUI** | i18n — tail coupe owner |
| `04_bet_france_vs_spain_20260714_203424.mp4` | 69.2 s | **55 s** | **OUI** | Pari pre-match — tail coupe owner |
| `04_bet_france_collect_20260716_011734.mp4` | 36.7 s | **33 s** | **OUI** | Post-match PERDU + Merkle — tail coupe owner |
| `04_agent_spain_counterbet_20260714_205239.mp4` | 17.1 s | **10 s** | OPTION | Agent OPEN — tail coupe owner |
| `06_agent_mcp_claude_102s.mp4` | **102.4 s** | TBD | **OUI** (trim interne) | MCP + Claude tool call |
| `06_agent_claim_won_20260716_012729.mp4` | **61.9 s** | TBD | **OUI** (trim interne) | Agent WON + explorer claim |
| `07_datalab_bonus_20260716_013426.mp4` | **51.6 s** | TBD | **OUI** (trim interne) | DataLab bonus |
| `02_wallet_connect_*.mp4` | — | — | **MANQUANT** | Pas dans `03_capture/mobile/` |

**Frames extraites** : `03_capture/_shot_log_frames/<nom_rush>/`

---

## ORDRE NARRATIF OBLIGATOIRE (montage + VO)

**Regle owner** : le **pari France** (`04_bet_france`) **AVANT** le **resultat** (`04_bet_france_collect`). Jamais l'inverse — le jury doit vivre : mise → match fini → perte + preuve.

```
Intro Veo (LOCK)
  → A  Fixtures SETUP/HOLD
  → B  Wallet connect (manquant ou extrait Phantom)
  → C  i18n flash
  → D  Pari France PRE-match     ← AVANT resultat
  → E  Resultat POST-match       ← APRES pari (LOST + Merkle)
  → F  Agent MCP + Claude
  → G  Agent WON + explorer
  → H  DataLab bonus
  → Slides trust + CTA
```

| Etape | Fichier montage | Statut match |
|-------|-----------------|--------------|
| D | `trimmed/04_bet_france_vs_spain_55s.mp4` | **Avant FT** — countdown, PLACE BET |
| E | `trimmed/04_bet_france_collect_33s.mp4` | **Apres FT** — FINISHED 0-2, LOST, Merkle OK |

**Interdit au montage** : montrer wallet LOST ou Merkle avant le plan pari France.

### A — `01_fixtures` (23 s) — SETUP/HOLD grille

| Temps ~ | Ecran |
|---------|--------|
| 0–6 s | **Home** EN : Natt Settlement, featured **France vs Spain** MetLife, badge **HOLD**, bouton **BET 1X2** |
| 6–15 s | Onglet **Matches** : scroll fixtures UPCOMING (France–Spain, England–Argentina) + FINISHED (scores) |
| 15–23 s | Meme grille, HOLD / BET 1X2 visible |

**VO doit dire** : fixtures TxLINE, badges SETUP/HOLD, pas « connect wallet » encore.

---

### B — `02_wallet_connect` — **TROU**

Pas de fichier local. Options :
1. Owner retrouve le mp4 ailleurs sur le PC
2. Refilm 15 s : deconnecte → Wallet → Reown → Phantom
3. Montage : extraire uniquement les plans Phantom dans `04_bet_france` (voir C) — moins propre

---

### C — `03_polish_i18n` — i18n + bet slip (**15 s montage**)

Fichier : `trimmed/03_polish_i18n_flash_15s.mp4` (coupe 00:00–00:15, tail supprimee).

| Temps ~ | Ecran |
|---------|--------|
| 0–3 s | **Fan bet slip** : DEMO MODE, France selectionnee, 1 USDC, **PLACE BET** (match France–Spain) |
| 6–9 s | Menu langue ouvert : EN, FR, ES, ZH, JA, RU, PT, DE |
| 9–15 s | UI **chinois** : 法国 vs 西班牙, 下注 |

**Attention** : ce rush n'est pas que i18n — il commence sur le pari. VO = « 8 languages » + peut enchaîner sur stake, pas « connect Phantom » si pas a l'ecran.

---

### D — `04_bet_france` — pari fan PRE-match (**55 s montage**)

**Montage : slot 4 — toujours AVANT E (resultat).**  
Fichier : `trimmed/04_bet_france_vs_spain_55s.mp4` (coupe 00:00–00:55, tail supprimee).

| Temps ~ | Ecran |
|---------|--------|
| 0–9 s | **Match France–Spain** : kickoff countdown ~25 min, HOLD, odds WINNER FRANCE 2.66 FAV |
| 12–24 s | **Splash Phantom** (ecran violet fantome) |
| 24–36 s | **Phantom** testnet, $0 cash |
| 36–54 s | Retour app : **HOLD VERDICT** low, Shin consensus France 37.5% / Spain 30.6%, PLACE YOUR BET, DEVNET |
| 54–55 s | Fin bet flow (coupe avant idle post-action) |

**VO doit dire** : match detail, edge HOLD, devnet USDC, pick France — **pas** « match finished » ni « Merkle ».

---

### E — `04_bet_france_collect` — post-match fan (**33 s montage**)

**Montage : slot 5 — toujours APRES D (pari). Jamais montrer LOST/Merkle avant le plan PLACE BET.**  
Fichier : `trimmed/04_bet_france_collect_33s.mp4` (coupe 00:00–00:33, tail supprimee).

| Temps ~ | Ecran |
|---------|--------|
| 0–6 s | **Matches** : France–Spain **FINISHED 0–2**, Espagne–Argentine UPCOMING |
| 12–18 s | **Settlement** TxLINE/Solana : **Merkle OK** vert, stat 0/2, root/leaf/proof, Solana Explorer |
| 24–30 s | **Wallet** fan : balance 19 USDC, Realized PnL **-1.00**, 5W–3L |
| 30–33 s | **Bet activity** : **France vs Spain LOST** -1.00 USDC (France) |

**VO doit dire** : match fini, settlement verifie, pari **perdu**, preuve Merkle — **pas** « collect payout » (fan a perdu).

---

### F — `06_agent_mcp_claude` (102 s) — agent + MCP

| Temps ~ | Ecran |
|---------|--------|
| 0–6 s | Home France–Spain upcoming (intro) |
| 27–33 s | **Claude.ai** Connectors : **Natt Pundit** CUSTOM |
| 84–90 s | Permission : **Get fixture agent status** from Natt Pundit → Always allow |
| 96–102 s | Reponse Claude : **Natt Pundit — Jury Summary** (20 MCP tools, SETUP/HOLD, escrow…) |

**VO doit dire** : Connect Agent, MCP, un tool call visible, agents never hold keys — **trim** le reste (pas 102 s a l'ecran).

---

### G — `06_agent_claim_won` (62 s) — agent gagne

| Temps ~ | Ecran |
|---------|--------|
| 0–6 s | **Agent Dashboard** read-only, wallet `2Kdxh…m4Qm`, MCP URL |
| 12–18 s | Balances : 11 USDC, Unrealized +1.00 |
| 12–18 s | **Bet activity** : **France vs Spain — Spain — WON +1.00** (en haut liste) |
| 24–30 s | Scroll autres paris (Belgium LOST, Norway CLAIMABLE…) |
| 33–39 s | **Betting policy** texte agent SETUP/HOLD |
| 51–57 s | **Solana Explorer** : tx **Success** `4S4bMc…` (claim agent) |

**VO doit dire** : agent autonome a gagne, settlement on-chain, claim verifiable explorer — **pas** bouton Collect UI (claim fait en coulisse VPS).

---

### H — `07_datalab_bonus` (52 s)

| Temps ~ | Ecran |
|---------|--------|
| 0–9 s | **Data Lab** : export ZIP, CLV **NOT PROVEN YET**, 20/500 samples |
| 21–27 s | Streams : proof, ticks, odds, scores (counts + KB) |
| 24–30 s | **Recent Merkle anchors** : verified / pending, Solana Explorer links |

**VO doit dire** : dataset exportable, streams append-only, preuves ancrees — pas « 228 tests » (slide pas filme).

---

## Montage propose (~5:00 avec intro Veo)

**Ordre fichiers = ordre story** (D puis E, jamais E avant D).

| Slot | Ordre | Video | Duree montage | VO v2 |
|------|-------|-------|---------------|-------|
| 0:00–0:26 | — | Veo + logos | LOCK (~26 s) | hook generique |
| 0:26–0:49 | 1 | **A** fixtures | 23 s | fixtures SETUP/HOLD |
| 0:49–1:09 | 2 | **B** wallet | 15–20 s (TBD) | connect Phantom |
| 1:09–1:24 | 3 | **C** i18n trimmed | **15 s** | 8 languages |
| 1:24–2:19 | **4** | **D** bet france trimmed | **55 s** | **pari France avant match** |
| 2:19–2:52 | **5** | **E** collect trimmed | **33 s** | **resultat apres** — LOST + Merkle |
| 2:52–3:42 | 6 | **F** mcp | **~45 s** (trim jury: connector + tool + reponse) | agent MCP |
| 3:42–4:12 | 7 | **G** agent won | ~25 s (trim TBD) | agent gagne |
| 4:12–4:32 | 8 | **H** datalab | ~15 s (trim TBD) | dataset / proofs |
| 4:32–4:52 | 9 | slide trust | PNG | 228 tests |
| 4:52–5:07 | 10 | CTA slide | PNG | close |

---

## Ancien TTS v1 — pourquoi jeter / reecrire

| WAV v1 | Probleme vs rushes reels |
|--------|--------------------------|
| `03_stakes` | Parle connect Reown longtemps — **pas de rush wallet dedie** |
| `04_reward` | « Collect payout » — fan **PERDU**, pas de collect |
| `05_twist` / `06_agents` | OK en theme mais timing 102 s rush ≠ 45 s audio |
| `07_trust` | 228 tests — **aucune capture** tests ; DataLab dit NOT PROVEN YET |
| `08_architecture` | OK partiel si sync DataLab |

**Action** : archiver `02_generative/tts/*.wav` → `02_generative/tts/_archive_v1/` puis regen **apres** ton OK sur ce shot log.

---

## Validation owner (coche avant TTS)

- [x] Take 01 = `203705_23s` seul (doublon supprime)
- [x] Ordre montage : **pari (D) avant resultat (E)**
- [x] Coupes tail owner : C 15s, D 55s, E 33s, agent Spain 10s (`mobile/trimmed/`)
- [x] TTS v2 genere : Charon + Zubenelgenubi (`02_generative/tts/00_*.wav` … `13_*.wav`)
- [ ] Wallet : retrouver 02 OU refilm OU accepter extrait Phantom dans 04
- [ ] OK VO « lost » pas « collect » pour fan
- [ ] OK agent claim = explorer tx pas bouton UI
- [ ] OK skip ou slide pour 228 tests

**Quand c'est coche → dis `go tts v2` et j'ecris les scripts EN calibres sur les durees + regen Charon.**
