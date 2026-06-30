# 235 — ARCHITECTURE MICROSERVICES : Natt Pundit (F66N)

> **SUPERSEDED** — see `239_ARCH_PREDICTION_MARKETS_MICROSERVICES.md` (prediction markets track; `edge-api` replaces `pundit-api`).

> **Statut** : ARCH SPEC — GO owner architecture microservices.
> **Ref** : `232_SPEC_F66N_NATT_TXODDS_WORLD_CUP.md`
> **Principe** : pro, isole, deployable — **pas** le monolithe Docker Hypernatt prod.

---

## 1. Pourquoi microservices (hackathon)

| Objectif | Comment |
|----------|---------|
| Pro / jury | Services nommes, health, contrats OpenAPI, pas un seul `pages/api` fourre-tout |
| Securite | Cle TxLINE **uniquement** dans `txline-gateway` |
| Scale mental | Front, data, intelligence = boundaries claires |
| Isolation prod | Zero partage avec `backend/services/*` Hypernatt |
| Deadline | **3 services** seulement — pas 15 containers |

---

## 2. Vue d'ensemble

```
                    ┌─────────────────┐
                    │   apps/web      │  PWA Next.js (Vercel #1)
                    │   iOS/Android/  │  UI only — zero secret
                    │   desktop       │
                    └────────┬────────┘
                             │ HTTPS REST (+ SSE option)
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌────────────────────┐       ┌────────────────────┐
   │ txline-gateway     │       │ pundit-api         │  Vercel #2 / #3
   │ :4001              │◄──────│ :4002              │  (ou 1 projet / routes)
   │ proxy TxLINE       │       │ Oracle/Crowd/Edge  │
   │ cache + health     │       │ commentary + SSE   │
   └─────────┬──────────┘       └────────────────────┘
             │
             ▼
   ┌────────────────────┐
   │ TxLINE (TxODDS)    │  externe
   └────────────────────┘

   packages/contracts  — types + zod partages
   packages/natt-core  — lib pure (edge, crowd) — import pundit-api only
```

**Regle** : `apps/web` **ne parle jamais** a TxLINE directement.

---

## 3. Services (3)

### 3.1 `apps/web` — Presentation (PWA)

| Champ | Valeur |
|-------|--------|
| Role | UI, PWA, routing, assets, SplashScreen |
| Stack | Next.js 14, Tailwind, next-pwa, R3F |
| Deploy | Vercel projet **natt-pundit-web** |
| URL publique | `https://natt-pundit.vercel.app` |
| Secrets | **aucun** TxLINE — seulement URLs services |

**Env** :
- `NEXT_PUBLIC_TXLINE_GATEWAY_URL`
- `NEXT_PUBLIC_PUNDIT_API_URL`

### 3.2 `services/txline-gateway` — Data plane

| Champ | Valeur |
|-------|--------|
| Role | Proxy TxLINE, normalisation JSON, cache court, rate limit |
| Stack | **Hono** (ou Fastify) + TypeScript — serverless-friendly |
| Deploy | Vercel serverless **ou** second projet Vercel |
| URL | `https://txline-gateway-natt-pundit.vercel.app` (exemple) |

**Endpoints MVP** :

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ status: "ok", mock: bool }` |
| GET | `/v1/fixtures` | Liste matchs WC |
| GET | `/v1/fixtures/:id` | Detail fixture |
| GET | `/v1/fixtures/:id/odds` | Snapshots odds |
| GET | `/v1/fixtures/:id/scores` | Events score |

**Env** : `TXLINE_API_TOKEN`, `TXODDS_MOCK`, `CACHE_TTL_SEC=10`

**DbC** : cle jamais loggee ; 502 si TxLINE down.

### 3.3 `services/pundit-api` — Intelligence plane

| Champ | Valeur |
|-------|--------|
| Role | Orchestrateur Oracle → Crowd → Edge + `commentary.ts` |
| Stack | Hono + `packages/natt-core` |
| Deploy | Vercel serverless (projet #3 ou routes separees) |
| URL | `https://pundit-api-natt-pundit.vercel.app` |

**Endpoints MVP** :

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | ok |
| GET | `/v1/pundit/:fixtureId/edge` | `{ verdict, edge_score, why, ... }` |
| GET | `/v1/pundit/:fixtureId/feed` | Messages commentary |
| GET | `/v1/pundit/:fixtureId/stream` | **SSE** updates (option MVP+) |

**Env** : `TXLINE_GATEWAY_INTERNAL_URL`, `EDGE_MIN`

Appelle `txline-gateway` en server-to-server (pas de CORS TxLINE cote browser).

---

## 4. Packages partages (monorepo)

| Package | Contenu | Importe par |
|---------|---------|-------------|
| `packages/contracts` | Zod schemas, types API, OpenAPI YAML | web, gateway, pundit |
| `packages/natt-core` | `crowd_proxy`, `natt_edge`, `commentary` (pur) | pundit-api, tests |

**Tooling** : `pnpm workspaces` ou `npm workspaces` — un `package.json` racine `hackathon/natt-pundit/`.

---

## 5. Dev local

`docker-compose.dev.yml` :

```yaml
services:
  txline-gateway:
    build: ./services/txline-gateway
    ports: ["4001:4001"]
  pundit-api:
    build: ./services/pundit-api
    ports: ["4002:4002"]
    environment:
      TXLINE_GATEWAY_INTERNAL_URL: http://txline-gateway:4001
```

`apps/web` : `npm run dev` → `.env.local` pointe `localhost:4001/4002`.

---

## 6. Deploy Vercel (prod hackathon)

| Projet Vercel | Root directory | URL |
|---------------|----------------|-----|
| natt-pundit-web | `hackathon/natt-pundit/apps/web` | URL jury principale |
| natt-pundit-txline | `hackathon/natt-pundit/services/txline-gateway` | API data |
| natt-pundit-engine | `hackathon/natt-pundit/services/pundit-api` | API pundit |

**CORS** : gateway + pundit autorisent uniquement `NEXT_PUBLIC_*` origin web.

**Alternative acceptable** : 1 projet Vercel avec rewrites `/api/gateway/*` et `/api/pundit/*` — **moins pro** ; owner a demande microservices → **3 projets preferes**.

---

## 7. Observabilite (L2)

| Service | `/health` | Logs |
|---------|-----------|------|
| web | page offline + build | Vercel analytics |
| txline-gateway | JSON + mock flag | `x-request-id` |
| pundit-api | JSON + edge version | correlation id |

Pas de mesh prod — suffisant hackathon.

---

## 8. Hors scope microservices MVP

- Kubernetes / VPS Hypernatt
- Message queue (Redis/Kafka) — cache in-memory OK
- Service mesh / Istio
- Base de donnees persistante (stateless MVP)
- x402 service (V1.1 service #4 si temps)

---

## 9. Validation owner

- [ ] Architecture **3 services** OK
- [ ] 3 projets Vercel OK (vs 1 projet — preciser si tu preferes simplifier deploy)

Repondre : **« je valide l'archi microservices »**
