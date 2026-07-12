# 238 — i18n + public repo (F66N)

> **Status:** owner GO 2026-06-26
> **Ref:** Hypernatt `frontend/next-i18next.config.js` (8 locales)

---

## 1. i18n — 8 languages

| Locale | Code | Example URL (English UI) |
|--------|------|--------------------------|
| English (default for jury) | `en` | `https://hypernatt.com/fr/nattpundit?lang=en` |
| French | `fr` | `https://hypernatt.com/fr/nattpundit?lang=fr` |
| Spanish | `es` | `https://hypernatt.com/fr/nattpundit?lang=es` |
| Chinese | `zh` | `https://hypernatt.com/fr/nattpundit?lang=zh` |
| Japanese | `ja` | `https://hypernatt.com/fr/nattpundit?lang=ja` |
| Russian | `ru` | `https://hypernatt.com/fr/nattpundit?lang=ru` |
| Portuguese | `pt` | `https://hypernatt.com/fr/nattpundit?lang=pt` |
| German | `de` | `https://hypernatt.com/fr/nattpundit?lang=de` |

**Note:** Next.js `basePath` is `/fr/nattpundit` in production. Locale is selected via `?lang=` or the header language switcher — not via `/en/nattpundit` path prefix.

**Stack:** `next-i18next` in `apps/web` (same pattern as `frontend/`).

**Files:**

```
apps/web/public/locales/
  en/natt_pundit.json
  fr/natt_pundit.json
  ... (x8)
```

**UI:** language selector (header) + `router.locale` — no hardcoded user-facing strings in pages (see `apps/web/lib/i18n.ts`).

**V1:** shell UI translated (nav, match list, HOLD/SETUP, activate TxLINE, offline). Commentary may stay EN in V1 if generated server-side.

---

## 2. Public GitHub repo

**Goal:** Earn hackathon jury + open-source credibility (like `hypernatt-terminal`).

| Include | Exclude |
|---------|---------|
| `hackathon/natt-pundit/` (code + docs + tests) | `.env`, `TXLINE_API_TOKEN` |
| README install + live link | sensitive fixtures |
| LICENSE (MIT recommended) | VPS secrets |
| Hackathon submit link | Hypernatt prod datasets |

**Suggested name:** `DIALLOUBE-RESEARCH/natt-pundit`

**Public README must contain:**

1. Live URL: `https://hypernatt.com/fr/nattpundit?lang=en`
2. Stack + TxLINE hackathon context
3. `npm install` / `npm run dev` local
4. Official TxLINE documentation link
5. Earn track: [Consumer and Fan Experiences](https://superteam.fun/earn/listing/consumer-and-fan-experiences)

**Sync:** monorepo `NATTAPP-portfolio-main` = dev source; public repo = mirror (`sync-public-github.ps1 -Push`).

**Never commit to public:** API keys, `.env.hackathon`, prod logs.

**Public repo language:** **English only** for README, SECURITY.md, and jury-facing docs. Internal AUDIT/SPEC/HANDOFF docs are stripped by the sync script.

---

## 3. Implementation order (updated 2026-06-27)

```
1. basePath + deploy /fr/nattpundit
2. public GitHub repo + README + LICENSE + CI
3. next-i18next + 8 JSON + switcher
4. TxLINE live (owner token)
5. 3D / audio polish
6. Submit Earn (URL + video)
```

**Sync command:** `hackathon/natt-pundit/scripts/sync-public-github.ps1 -Push`

---

## 4. Verdict

**GO i18n + GO public repo** — international jury accessibility + hackathon credibility.
