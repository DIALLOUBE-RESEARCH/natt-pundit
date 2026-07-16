# AUDIT F96N — Escrow Keeper snapshot (2026-07-13 UTC)

Post-deploy audit for **F96N P1 escrow keeper** + fan UX settle delegation.
Complements [275_SECURITY_REMEDIATION_MASTER_PLAN.md](./275_SECURITY_REMEDIATION_MASTER_PLAN.md) and [../solana-escrow/SECURITY.md](../solana-escrow/SECURITY.md).

**Skill ref:** hackathon L2 (threat model + invariants + automated proofs).

## 1. Threat model (5 actors)

| # | Attacker | Attack | Blast radius |
|---|----------|--------|--------------|
| T1 | Malicious MCP client | SPL drain via submit relay | User wallet USDC |
| T2 | Fake score / outcome | Wrong `winning_side` on settle | Pool payout integrity |
| T3 | Fan + keeper race | Double `settle` tx | Wasted fees / UX confusion |
| T4 | Keeper key compromise | Spam bogus `settle` | Keeper SOL only (no custody) |
| T5 | CPI bypass | Settle without TxLINE proof | On-chain reject (fail-closed) |

## 2. Invariants (must hold)

| ID | Invariant | Layer | Evidence |
|----|-----------|-------|----------|
| I1 | `winning_side` never client-supplied | MCP + on-chain | F95N removed `settle_knockout_tab`; tests MCP |
| I2 | CPI invalid -> pool stays unsettled | Anchor | Sec3 X-Ray 0 findings; `anchor test` |
| I3 | Keeper signs **settle only** | escrow-keeper | `broadcastSettle` in `escrow-agent.mjs`; no claim/refund ix |
| I4 | Fan skips `settlePool` when keeper ON | web | `fanBetOrchestrator.test.ts` keeper ON cases |
| I5 | Submit relay blocks arbitrary SPL transfer | MCP | F95N ATA whitelist tests |
| I6 | Keeper skips settled / solo-side pools | escrow-keeper | `loop.test.mjs` idempotence + solo-side |
| I7 | Keeper key VPS-only | infra | `.env.natt_pundit`; not in public mirror |

## 3. Automated proof commands (local)

```powershell
cd hackathon\natt-pundit\packages\natt-core; npm test
cd ..\..\services\mcp; npm test
cd ..\escrow-keeper; npm test
cd ..\..\apps\web; npx vitest run lib/fanBetOrchestrator.test.ts
```

```bash
# solana-escrow (Docker or WSL)
cd hackathon/solana-escrow && cargo audit && cargo clippy -p natt_escrow -- -D warnings -A unexpected-cfgs -A deprecated
```

## 4. Smoke (VPS prod)

```bash
docker compose exec -T natt-pundit-escrow-keeper wget -qO- http://127.0.0.1:4013/health
curl -sf https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify
```

## 5. Verdict matrix

| Invariant | Status | Notes |
|-----------|--------|-------|
| I1 | **PASS** | F95N closed |
| I2 | **PASS** | Sec3 X-Ray 2026-07-12 |
| I3 | **PASS** | settle-only worker |
| I4 | **PASS** | vitest `collectFanPayout` keeper ON/OFF |
| I5 | **PASS** | MCP 50/50 |
| I6 | **PASS** | keeper 5/5 loop tests |
| I7 | **PASS** | key on VPS `.env.natt_pundit` only |

**Overall verdict: PASS** — L1+L2 audit complete for hackathon submission.

## 6. Post-hackathon (optional L3)

- External Anchor audit (OtterSec / Neodyme)
- Property/fuzz tests on CPI account validation
- Snyk CI token for transitive npm tracking

## 7. Journal

| Date | Action |
|------|--------|
| 2026-07-13 | Keeper deployed VPS; fan orchestrator tests; threat model in `escrow-keeper/README.md` |
| 2026-07-13 | This snapshot doc + re-run test suite |
