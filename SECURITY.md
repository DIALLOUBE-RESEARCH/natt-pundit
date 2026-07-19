# Security — Natt Pundit / Natt Settlement

Canonical remediation plan: [275_SECURITY_REMEDIATION_MASTER_PLAN.md](./docs/275_SECURITY_REMEDIATION_MASTER_PLAN.md)

## Scope

Hackathon fan experience (TxLINE WC) + devnet escrow parimutuel + MCP agents (x402 Solana devnet). **Not** a production sportsbook or custodian. All escrow funds are **devnet USDC** (Circle canonical devnet mint enforced on-chain).

## Trust model in one paragraph

Match outcomes are never asserted by a client. The escrow program (`GPSU49...`) derives `winning_side` exclusively from a TxLINE `validate_stat` CPI: the settle transaction embeds Merkle proofs of the on-chain attested score stats, TxLINE's program verifies them, and the escrow reads the proven predicate (home/draw/away). If a result cannot be proven (e.g. TxLINE has no data for a penalty shootout), the pool **cannot settle** and every depositor gets a full refund (`refund_all`) — fail-closed, no payout on unproven data.

## Exposed surfaces and controls

| Surface | Controls |
|---------|----------|
| Escrow program `GPSU49...` (devnet) | F78N CPI-derived `winning_side`; F80N canonical USDC mint + token account constraints; F95N removed `settle_knockout_tab` (the only instruction that accepted a client-asserted winner) |
| `/mcp-pundit/` MCP (20 tools) | F77N x402 verify-then-settle + SettlementCache; F82N nginx rate limit; session IP/UA bind |
| `submit_signed_escrow_tx` relay | F79N instruction whitelist: escrow program + ComputeBudget + Associated Token Account program only — direct SPL Token transfers are rejected (tested) |
| `services/escrow-keeper` (F96N P1) | **Settle-only** worker: permissionless on-chain `settle` ix; VPS key is **fee payer** (devnet SOL) only — **never** signs `claim`/`refund` for users; kill switch `NATT_PUNDIT_ESCROW_KEEPER_ENABLED` |
| Web `/api/solana/rpc` + gateway `/v1/solana/rpc` | F81N JSON-RPC method allowlist + body size cap; F95N per-IP sliding-window rate limit (60/min default, `NATT_RPC_RATE_LIMIT_PER_MIN`) |

## Escrow position lifecycle (F84N)

- `UserPosition` PDAs are **not closed** on claim/refund — the `claimed` flag prevents double payout.
- Classic Solana revival via `close` + reopen is **not applicable** (no close instruction).
- Stale `amount` on claimed positions is a UI/accounting quirk only — funds cannot be withdrawn twice.

## What the README Security badge means

**“app audit CRIT/HIGH closed”** = findings from our pre-submission application audit ([275](./docs/275_SECURITY_REMEDIATION_MASTER_PLAN.md)) on escrow / MCP / x402 / RPC surfaces are closed (F95N, F96N, …).

It does **not** mean zero advisories in the full `apps/web` Next.js / wallet dependency tree. Traceability uses **feature IDs** (F95N…) and the live program id — private monorepo git SHAs are **not** expected to resolve on this public mirror.

## Known limitations (documented on purpose)

We prefer an honest list over a silent gap:

1. **CPI stat-key pinning (planned hardening).** The on-chain parser derives the winner from the proven comparison predicate but does not yet pin *which* stat keys were proven. Exploiting this requires forging a valid TxLINE Merkle proof for a different stat pair — a much higher bar than a client argument, but not zero. Pinning is deferred until the production stat-key pair is confirmed against live TxLINE proofs (observed vectors use `1002/1003`, current feed docs say `1/2`; pinning the wrong pair would brick all settlements).
2. **Demo x402 open access.** `devnet_open_access` keeps some MCP tools free for jury evaluation. This is a deliberate hackathon setting, controlled by env, not an oversight.
3. **Devnet only.** No mainnet funds are ever custodied. The TxLINE mainnet RPC relay exists solely for the TxLINE data subscription flow (user-signed, no custody).
4. **npm audit (2026-07-10).** `npm audit --omit=dev` reports transitive issues in `viem`/`ws` (wallet stack). No exploitable path in our server surfaces; tracked for post-hackathon dependency bump — not a runtime escrow/MCP risk.
5. **`apps/web` Next.js pin (`14.2.28`).** Known upstream middleware/SSRF advisories exist on this line; patched minors are available. Post-hackathon bump planned — out of escrow/MCP runtime scope; no redeploy mid-jury without regression risk.
6. **Escrow unit tests = parse suite, not full localnet e2e.** `cargo test -p natt_escrow` covers settle-critical `validate_stat` parse (in-tree fixture + reject paths). Full create/deposit/settle against TxLINE on a local validator is **not** automated yet — see [JURY_VERIFICATION.md](./docs/JURY_VERIFICATION.md) for live Solscan settlement proofs.

## MCP Server & Dependencies Security Scan

**Scan date:** 2026-07-12 UTC  
**Scope:** `hackathon/natt-pundit` monorepo — `services/mcp` + `packages/*` (workspaces)  
**Environment:** Node.js 22, `npm audit` from monorepo root (`package-lock.json`)

### 1. `npm audit --audit-level=high`

#### Monorepo root (all workspaces)

```text
20 vulnerabilities (7 moderate, 13 high)
```

Includes `apps/web` wallet/Next.js stack (`next`, `viem`/`ws`, `next-pwa`) — **out of MCP server runtime scope**.

#### `packages/*` (direct server libraries)

| Workspace | Command | Result |
|-----------|---------|--------|
| `@natt-pundit/contracts` | `npm audit --audit-level=high -w @natt-pundit/contracts` | **0 vulnerabilities** |
| `@natt-pundit/natt-core` | `npm audit --audit-level=high -w @natt-pundit/natt-core` | **0 vulnerabilities** |

#### `services/mcp` (`@natt-pundit/mcp`)

```bash
npm audit --audit-level=high --omit=dev -w @natt-pundit/mcp
```

```text
9 vulnerabilities (4 moderate, 5 high)
```

| Severity | Count | Source | MCP direct dep? |
|----------|-------|--------|-----------------|
| **high** | 5 | Transitive `@solana/web3.js` / `@coral-xyz/anchor` / `@solana/spl-token` (`bigint-buffer`, `ws` via hoisted `viem`) | No — Solana SDK stack |
| moderate | 4 | `uuid` via `jayson` → `@solana/web3.js` | No |

**No high-severity finding in MCP-owned code** (`server.js`, `lib/`, `test/`). All highs are upstream Solana/npm transitive advisories with no demonstrated exploit path on the MCP HTTP surface (stateless tools + x402 verify-then-settle; no `_.template`, no user-controlled `bigint-buffer` calls).

| Verdict | Detail |
|---------|--------|
| **packages/** | **PASS** — 0 vulnerabilities |
| **services/mcp** | **PASS (accepted transitive)** — 0 direct; 5 high upstream Solana SDK only; tracked post-hackathon |

Exit code: **1** at `--audit-level=high` (expected while upstream Solana SDK advisories remain open).

### 2. `snyk test`

```bash
npm install -g snyk
snyk test --json
```

| Result | Detail |
|--------|--------|
| **Status** | **Not executed** — CLI requires authenticated account |

```json
{ "ok": false, "error": "Use `snyk auth` to authenticate.", "path": "/app" }
```

Snyk CLI also failed to download the native binary on Windows (TLS `UNABLE_TO_VERIFY_LEAF_SIGNATURE`). VPS Docker run confirmed the same auth gate. **WAIVE:** no `SNYK_TOKEN` in hackathon CI; `npm audit` used as the dependency gate for pre-submission.

### Overall verdict (MCP + packages)

| Tool | Verdict |
|------|---------|
| `npm audit` (`packages/*`) | **PASS** — 0 vulnerabilities |
| `npm audit` (`services/mcp`) | **PASS** — 0 direct highs; 5 transitive Solana SDK (documented, no MCP exploit path) |
| `snyk test` | **WAIVE** — auth required (`snyk auth` / `SNYK_TOKEN` not available pre-submission) |

## What we never ask for

- Production Hypernatt vault private keys
- Mainnet trading keys for jury demo
- Committing `TXLINE_API_TOKEN` or CDP secrets

## Reporting

GitHub issue on this repo or https://hypernatt.com (maintainer contact).
