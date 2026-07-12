# services/edge-api — Intelligence plane

Hono service: Shin consensus (via gateway odds), Natt model combine, SETUP/HOLD verdict.

Endpoints:

- `GET /health`
- `GET /v1/edge/:fixtureId` — full match edge payload
- `GET /v1/edge/:fixtureId/verdict` — edge verdict only

Env: `TXLINE_GATEWAY_URL`, `CORS_ORIGIN`, `PORT` (default 4002).
