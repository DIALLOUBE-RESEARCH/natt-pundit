# Natt Settlement — Submission kit (F68N)

**Track:** TxODDS World Cup — Prediction Markets & Settlement (Superteam Solana ecosystem partner track via TxODDS hackathon).

**Deadline:** 2026-07-19

## Live URLs

| Resource | URL |
|----------|-----|
| App | https://hypernatt.com/fr/nattpundit |
| Gateway health | https://hypernatt.com/api/natt-pundit/txline/health |
| Edge health | https://hypernatt.com/api/natt-pundit/edge/health |
| Example proof | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof |
| Proof verify | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify |
| Edge board | https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary |

## Endpoints (jury smoke)

```bash
# Merkle proof + validated flag
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof

# Verify only
curl -s https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify

# SETUP/HOLD board (all fixtures, cap 20)
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary

# Single match edge
curl -s https://hypernatt.com/api/natt-pundit/edge/v1/edge/18175397/verdict
```

## 5-minute video script outline

1. **0:00–0:30** — Problem: prediction markets need verifiable settlement + honest edge, not vibes.
2. **0:30–1:30** — Live app: fixture grid, SETUP/HOLD badges, match detail with pi_tx / pi_model / c.
3. **1:30–2:30** — Math slide: Shin pi_tx, pre-registered pi_model, logit combine, epsilon gate (no ML tuning).
4. **2:30–3:30** — Settlement panel: TxLINE proof, Merkle path, green "Merkle verifie" badge (`validated=true`).
5. **3:30–4:30** — Architecture: web -> edge-api -> txline-gateway -> TxLINE API; natt-core pure tests.
6. **4:30–5:00** — CTA: open source mirror, TxLINE activate flow, World Cup live data.

## What we prove

- **Prediction**: SETUP/HOLD from two-source logit combine vs Shin consensus (fail-closed without odds).
- **Settlement**: Off-chain Merkle verification of TxLINE stat-validation proofs (SHA-256, ProofNode sibling order).

## Repo sync (public mirror)

```powershell
.\hackathon\natt-pundit\scripts\sync-public-github.ps1 -Push
```

Requires `gh` auth to `DIALLOUBE-RESEARCH/natt-pundit`.

## Contact

HyperNatt / NATTAPP — see README in monorepo hackathon path.
