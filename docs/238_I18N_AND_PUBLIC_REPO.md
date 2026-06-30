# 238 — i18n + repo public (F66N)

> **Statut** : GO owner 2026-06-26
> **Ref** : Hypernatt `frontend/next-i18next.config.js` (8 locales)

---

## 1. i18n — 8 langues (comme Hypernatt)

| Locale | Code | URL exemple |
|--------|------|-------------|
| English (default) | `en` | `https://hypernatt.com/en/nattpundit` |
| Francais | `fr` | `https://hypernatt.com/fr/nattpundit` |
| Espanol | `es` | `https://hypernatt.com/es/nattpundit` |
| Chinois | `zh` | `https://hypernatt.com/zh/nattpundit` |
| Japonais | `ja` | `https://hypernatt.com/ja/nattpundit` |
| Russe | `ru` | `https://hypernatt.com/ru/nattpundit` |
| Portugais | `pt` | `https://hypernatt.com/pt/nattpundit` |
| Allemand | `de` | `https://hypernatt.com/de/nattpundit` |

**Stack** : `next-i18next` dans `apps/web` (meme pattern que `frontend/`).

**Fichiers** :

```
apps/web/public/locales/
  en/natt_pundit.json
  fr/natt_pundit.json
  ... (x8)
```

**Nginx** : une location par locale OU rewrite unique `^/(en|fr|...)/nattpundit` → service web.

**UI** : selecteur langue (coin header) + `router.locale` — pas de texte en dur dans les pages.

**V1** : traduire shell UI (nav, match list, HOLD/SETUP, activate TxLINE, offline). Commentary Natt peut rester EN en V1 si genere cote API.

---

## 2. Repo GitHub public

**But** : jury Earn + credibilite open-source (comme `hypernatt-terminal`).

| Inclus | Exclu |
|--------|-------|
| `hackathon/natt-pundit/` (code + docs + tests) | `.env`, `TXLINE_API_TOKEN` |
| README install + lien live | fixtures si donnees sensibles |
| LICENSE (MIT recommande) | secrets VPS |
| Lien submit hackathon | dataset Hypernatt prod |

**Nom suggere** : `DIALLOUBE-RESEARCH/natt-pundit` (ou `natt-pundit-txodds`).

**README public** doit contenir :

1. URL live : `https://hypernatt.com/en/nattpundit`
2. Stack + TxLINE hackathon
3. `npm install` / `npm run dev` local
4. Lien doc TxLINE officielle
5. Track Earn : [Consumer and Fan Experiences](https://superteam.fun/earn/listing/consumer-and-fan-experiences)

**Sync** : monorepo `NATTAPP-portfolio-main` = source dev ; repo public = mirror ou subtree (push script CI / manuel post-release).

**Interdit commit public** : cles API, `.env.hackathon`, logs prod.

---

## 3. Ordre implementation (corrige 2026-06-27)

```
1. basePath + deploy /fr/nattpundit (MVP une langue)
2. repo public GitHub + README + LICENSE + CI  ← credibilite hackathon / Earn
3. next-i18next + 8 JSON + switcher + nginx locales
4. TxLINE live (token owner)
5. 3D / audio polish
6. Submit Earn (URL + video)
```

**Sync repo** : `hackathon/natt-pundit/scripts/sync-public-github.ps1 -Push`

Monorepo = source dev ; `DIALLOUBE-RESEARCH/natt-pundit` = mirror public (jamais de secrets).

---

## 4. Verdict

**GO i18n + GO repo public** — aligne accessibilite jury internationale + credibilite hackathon.
