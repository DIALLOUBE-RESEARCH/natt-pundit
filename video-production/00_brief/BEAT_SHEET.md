# Beat sheet — 5:00 (v2 jury TxLINE + fan journey)

> **Valide owner 2026-07-13.** Fusion `SUBMISSION_KIT.md` §5 + intro Veo lock + flow Hamet (wallet, i18n flash, bet→claim, agent/MCP).
> **Handoff** : `HANDOFF_VIDEO_REPRISE_AGENT.md`

## Formule

```
[0:00–0:26]  AMBIANCE + LOGOS (Veo lock)
[0:26–5:00]  TxLINE → wallet → bet → proof → agent/MCP → trust → CTA
```

**Format** : 9:16 vertical · scrcpy mobile · `?lang=en` sauf flash i18n.

---

## Timeline detaillee

| Temps | Scene | Source | Capture / asset |
|-------|-------|--------|-----------------|
| **0:00–0:08** | Bar tension | Veo A1 | `A1_bar_tension_9x16_silent.mp4` LOCK |
| **0:08–0:12** | Joie tribune | Veo A2 (4s) | `A2_stadium_joy_9x16_silent_4s.mp4` LOCK |
| **0:12–0:18** | Emotion fan | Veo A3 | `A3_fan_face_emotion_9x16_silent.mp4` LOCK |
| **0:18–0:22** | Marge pacing | edit | silence / musique |
| **0:22–0:26** | Logos WC + TxODDS | overlay | `logo_intro_9x16_silent.mp4` |
| **0:26–0:40** | Hook VO — qui decide le score ? | TTS `01_hook.wav` | sous-titre si besoin |
| **0:40–1:00** | Grille fixtures **SETUP/HOLD** (TxLINE live) | scrcpy | `03_capture/mobile/01_fixtures_setup_hold.mp4` |
| **1:00–1:25** | **Connect wallet** Reown → Phantom (app deconnectee) | scrcpy | `02_wallet_connect_reown_phantom.mp4` |
| **1:25–1:40** | Flash **i18n** EN → ZH → EN (overlay « 8 languages ») | scrcpy | `03_polish_i18n_flash.mp4` — **pas** jour/nuit |
| **1:40–2:50** | **France–Espagne** `18237038` : card → bet → FT → keeper « Settlement in progress… » → **Collect** | scrcpy | `04_bet_france_full_journey.mp4` |
| **2:50–3:15** | Match **fini** `18172280` : badge proof vert + settlement valide | scrcpy | `05_proof_merkle_finished.mp4` |
| **3:15–4:15** | **Agent** : `/agent` Spain · MCP header · **Claude web** connect + 1 prompt EN (`get_fixture_agent_status`) | scrcpy + desktop | `06_agent_mcp_claude.mp4` |
| **4:15–4:30** | Wallet tab (PnL / historique) — **court** si deja vu en 1:40 | scrcpy | optionnel / 10s max |
| **4:30–4:45** | Trust : **228 tests** + CPI diagramme (pas wagmi — **Reown Solana**) | overlay | `07_trust_tests_slide.png` · corriger VO 220→228 en sous-titre |
| **4:45–5:00** | CTA : repo public + deadline **19 juillet** + devnet disclaimer | TTS `09_close.wav` + slide | `08_cta_slate.png` |

---

## Fixtures

| ID | Role | Quand filmer |
|----|------|--------------|
| **18237038** | France vs Spain — pari live Hamet (home France) | Avant / pendant match |
| **18172280** | Match fini — proof Merkle + badge vert | Anytime (backup jury) |

Agent pari **Spain (away)** sur `18237038` — script VPS / CDP en coulisse pendant ou apres segment fan.

---

## Checklist capture Hamet (ordre recommande)

1. [ ] Phantom **Devnet** + SOL + USDC faucet
2. [ ] `01_fixtures_setup_hold` — scroll 2–3 cards SETUP/HOLD
3. [ ] `02_wallet_connect` — **disconnect d'abord** si deja connecte
4. [ ] `03_polish_i18n_flash` — header langue EN→ZH→EN (~15s)
5. [ ] `04_bet_france_full_journey` — create pool si besoin → deposit → post-FT collect
6. [ ] `05_proof_merkle` — fixture finie, onglet settlement / proof vert
7. [ ] `06_agent_mcp_claude` — `/agent` + CONNECT AGENT + Claude web 1 tool call
8. [ ] (opt) Wallet tab 10s si PnL pas clair dans 04

**Interdit** : jour/nuit long · wagmi (stack = **Reown AppKit Solana**) · regen TTS/Veo sans go owner.

---

## Mapping VO TTS (fichiers existants — NE PAS regenerer)

| WAV | Nouveau slot approx | Contenu |
|-----|---------------------|---------|
| `01_hook` | 0:26–0:40 | Hook |
| `02_reveal` | 0:40–1:00 | Fixtures SETUP/HOLD |
| `03_stakes.wav` | 1:00–1:25 + 1:40–2:00 | Connect Phantom through Reown… (**regen 2026-07-13**) |
| `04_reward` | 2:00–2:50 + 2:50–3:15 | Collect + Merkle proof |
| `05_twist` | 3:15–3:45 | Agent autonome |
| `06_agents` | 3:45–4:15 | MCP / Claude |
| `07_trust` | 4:30–4:45 | Tests — **sous-titre 228** (audio dit 220) |
| `08_architecture` | mix 4:30 | TxLINE → gateway → escrow |
| `09_close` | 4:45–5:00 | CTA |

J-cuts OK — l'audio peut commencer avant le cut video (`AUDIO_FINISHING_PRO.md`).

---

## URLs prod

- App : https://hypernatt.com/fr/nattpundit?lang=en
- Agent : https://hypernatt.com/fr/nattpundit/agent?lang=en
- MCP : https://hypernatt.com/mcp-pundit/protocol
- Data Lab (optionnel 15s B-roll) : `?lang=en&tab=datas` ou `/datas`

Docs : `WC_PITCH_PLAYBOOK.md` | `SUBMISSION_KIT.md` §5 | `vo_pitch_draft.md`
