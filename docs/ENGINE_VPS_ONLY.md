# F86N v2 — Edge engine VPS-only (total moat)

**The Benter formula (`packages/natt-edge-engine/`) is NEVER published on GitHub.**

| Location | Contents |
|----------|----------|
| `~/HYPERNATT/private/natt-edge-engine/` | **Prod source of truth** (VPS + owner backup) |
| `packages/natt-edge-engine/` | Local build copy (gitignored) |
| `scripts/public-mirror-stub/natt-edge-engine/` | Jury / CI stub only |

---

## One-time — seed VPS (from a machine that has the real engine)

```powershell
scp -r "C:\Users\junio\NATTAPP-portfolio-main\hackathon\natt-pundit\packages\natt-edge-engine" hypernatt-vps:~/HYPERNATT/private/natt-edge-engine
```

Or on the VPS after first manual deploy:

```bash
mkdir -p ~/HYPERNATT/private/natt-edge-engine
# copy the folder once — git pull never overwrites it
```

---

## Deploy edge-api (required VPS one-liner)

```bash
cd ~/HYPERNATT && bash hackathon/natt-pundit/scripts/ensure-edge-engine.sh && export COMPOSE_FILE=docker-compose.prod.yml && git pull origin main && docker compose up -d --build natt-pundit-edge-api natt-pundit-web && docker compose restart nginx
```

`ensure-edge-engine.sh` copies `~/HYPERNATT/private/natt-edge-engine` → `hackathon/natt-pundit/packages/natt-edge-engine` then **refuses the stub** in prod.

---

## Local dev (Windows)

The `packages/natt-edge-engine/` folder stays on disk (gitignored). If missing:

```powershell
cd C:\Users\junio\NATTAPP-portfolio-main\hackathon\natt-pundit
node scripts/ensure-edge-engine.mjs
```

Engine tests (local only):

```powershell
npm run test:engine
```

---

## Git history purge (owner — full moat on monorepo)

Older commits still contain `natt-core` with the formula. Once:

```bash
git filter-repo --path hackathon/natt-pundit/packages/natt-core/src/combine.ts --invert-paths
# or make NATTAPP-portfolio repo PRIVATE on GitHub
```

---

## Post-deploy smoke

```bash
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary | head -c 300
```

Expected: `conviction`, **not** `pi_model`.
