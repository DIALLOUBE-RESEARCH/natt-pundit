# Deploy Natt Settlement

**URL jury** : **https://hypernatt.com/fr/nattpundit**

## Routes prod

| Surface | URL |
|---------|-----|
| Web | `https://hypernatt.com/fr/nattpundit` |
| TxLINE proxy | `https://hypernatt.com/api/natt-pundit/txline/` |
| Edge API | `https://hypernatt.com/api/natt-pundit/edge/` |

## Deploy VPS (maintainers)

```bash
cd ~/HYPERNATT && export COMPOSE_FILE=docker-compose.prod.yml && git pull origin main
cp -n hackathon/natt-pundit/.env.example .env.natt_pundit
docker compose up -d --build natt-pundit-gateway natt-pundit-edge-api natt-pundit-web
docker compose restart nginx
```

Variables `.env.natt_pundit` (VPS, jamais commit) :

```bash
TXODDS_MOCK=true
TXLINE_API_TOKEN=
CORS_ORIGIN=https://hypernatt.com
NEXT_PUBLIC_EDGE_API_URL=https://hypernatt.com/api/natt-pundit/edge
```

## Dev local

```bash
cd hackathon/natt-pundit
npm install
npm run dev
docker compose -f docker-compose.hackathon.yml up -d --build
```

## Smoke

```bash
curl -sf https://hypernatt.com/api/natt-pundit/txline/health
curl -sf https://hypernatt.com/api/natt-pundit/edge/health
curl -sf -o /dev/null -w "%{http_code}\n" https://hypernatt.com/fr/nattpundit
```

## Teardown

```bash
docker compose -f docker-compose.prod.yml stop natt-pundit-gateway natt-pundit-edge-api natt-pundit-web
docker compose -f docker-compose.prod.yml rm -f natt-pundit-gateway natt-pundit-edge-api natt-pundit-web
```
