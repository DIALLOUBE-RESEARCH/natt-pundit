# Capture mobile 9:16 — Agent + MCP (pas de desktop OBS)

> **Date** : 2026-07-13  
> **Decision owner** : video 100% vertical scrcpy — OBS/desktop 16:9 interdit.

## Pourquoi

- Livrable hackathon = **9:16** natif.
- OBS / Cursor full screen = **16:9** → bandes noires ou recadrage amateur.
- L'app Stitch est deja **mobile-first** ; agent + MCP sont filmables sur le tel.

## Parcours scrcpy (ordre suggere)

| Plan | Action mobile | URL / geste |
|------|---------------|-------------|
| Fixtures | Onglet **Matches** | `?tab=matches&lang=en` |
| Pari France | Match detail → Parier | `/match/18237038` |
| Wallet collect | Onglet **Wallet** | `?tab=wallet` |
| Agent ledger | Wallet → **Autonomous agent ledger** OU direct | `/agent?lang=en` |
| MCP Connect | Header → **CONNECT AGENT** | modal bottom sheet |
| DataLab / tests | Onglet **DataLab** | `/datas` |

## Script VPS (Spain bet)

Pendant que tu filmes `/agent` sur le tel, lancer sur VPS :

```bash
cd ~/HYPERNATT && source .env && node hackathon/natt-pundit/scripts/natt-agent-cdp-autonomous.mjs auto --fixture 18237038
```

(Pari **away** Spain — toi tu paries **home** France sur le meme match.)

## Fichiers rush

Tout dans `03_capture/mobile/` — **pas** `03_capture/desktop/`.

Noms suggeres :

- `04_agent_dashboard.mp4`
- `05_mcp_connect.mp4`

## Deploy UI (lien Wallet → /agent)

Code local F98N : carte Wallet + modal MCP bottom sheet mobile.  
**Deploy** avant tournage : push → rebuild `natt-pundit-web` VPS.
