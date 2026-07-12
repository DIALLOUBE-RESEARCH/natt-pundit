# 275 — Natt Pundit Security Remediation Master Plan (post-audit 2026-07-03)

> **Status:** ACTIVE — source of truth for all `[NATT-PUNDIT]` security remediation.
> **Rule:** no production code on this plan without AUDIT/SPEC/TASK triplet + explicit owner **go** per feature F#NN.

---

## 1. Scope

| In scope | Out of scope (other ticket / world) |
|----------|-------------------------------------|
| `hackathon/natt-pundit/**` | PolyMimo, live Hypernatt trading |
| `hackathon/solana-escrow/**` | Terminal MCP `m2m-service` (unless explicit `[NATT+HL]` alignment) |
| nginx routes `/mcp-pundit`, `/api/natt-pundit/*` | Hypernatt perp vault / legs |

---

## 2. Findings matrix (read-only audit + gap analysis)

| ID | Finding | Sev | Code evidence | Status | Feature |
|----|---------|-----|---------------|--------|---------|
| **X1** | Double-settlement x402 Solana (no SettlementCache) | CRITICAL | `x402-facilitator-client.mjs` | **DONE** F77N `341c2675` | F77N |
| **X2** | Two-phase verify/settle gap (deliver before settle) | HIGH | `mcp-pundit-server.mjs` (pre F77N) | **DONE** F77N | F77N |
| **X3** | MCP session bearer without IP/UA bind | MED-HIGH | `sessions` Map L79 | **DONE** F77N | F77N |
| **C1** | `winning_side` client-supplied, not tied to TxLINE CPI predicate | **CRITICAL** | `lib.rs` settle | **DONE** F78N on-chain | **F78N** |
| **H5** | `submit_signed_escrow_tx` relays any signed tx | **HIGH** | `escrow-agent.mjs` | **DONE** F79N | **F79N** |
| **H2** | USDC mint not constrained to devnet canonical | HIGH | `CreatePool` / `Deposit` | **DONE** F80N | **F80N** |
| **H3** | Deposit token accounts without owner/mint checks | HIGH | `Deposit` | **DONE** F80N | **F80N** |
| **H6** | Open Solana RPC proxy (gateway + web) | HIGH | `txline-gateway`, `api/solana/rpc.ts` | **DONE** F81N | **F81N** |
| **M6** | Public MCP without rate limit | MEDIUM | nginx `/mcp-pundit/` | **DONE** F82N | **F82N** |
| **M3** | Economic x402 bypass (devnet_open, intro-free, jury) | MEDIUM | `intro-free.mjs` | **DOC** F83N | **F83N** |
| **M4** | `verify` used client `accepted` (substitution) | MEDIUM | `x402-pundit.mjs` | **DONE** F77N | F77N |
| **I1** | On-chain double-claim | INFO | `claimed` gate | **OK** | — |
| **I4** | Classic revival (close/reopen PDA) | LOW | no `close` on position | **WAIVE** | doc F84N |
| **I4b** | Stale `amount` after claim (UI accounting) | INFO | `position.amount` non-zero | **PARTIAL** UI fix F75N | — |
| **T1** | Terminal MCP async settle / no cache | MEDIUM | `mcp-signal-server.mjs` | **DONE** F85N | **F85N** |
| **C2** | `settle_knockout_tab`: client-supplied `pen_winner_side` (never proven on-chain) | **CRITICAL** | `lib.rs` (pre F95N) | **DONE** F95N `9d9c95dd` — instruction removed; pen winner via standard settle keys 5001/5002, else `refund_all` fail-closed | **F95N** |
| **H7** | Submit whitelist blocked agent txs (missing ATA) + no theft vector tested | HIGH | `escrow-submit-guard.mjs` | **DONE** F95N `6dda3439` — ATA program whitelist, direct SPL transfer rejected (tested) | **F95N** |
| **H8** | Public RPC relays without per-IP rate limit (web + gateway) | HIGH | `api/solana/rpc.ts`, gateway | **DONE** F95N `9ffd70ba` — sliding window 60/min per IP | **F95N** |
| **M7** | CPI parser does not pin stat keys (theoretical stat substitution with valid Merkle proof) | MEDIUM | `txline_ix.rs` | **OPEN documented** — pinning deferred: ambiguous live keys (observed 1002/1003 vs feed doc 1/2) | F96N (future) |

---

## 3. Execution waves (mandatory order)

```
WAVE A — x402 MCP (API funds)     [DONE F77N]
WAVE B — On-chain escrow (devnet USDC)   [BLOCKING honest parimutuel demo]
WAVE C — Infra exposure (RPC, rate limit, hackathon bypass)
WAVE D — Hygiene / doc / cross-world Terminal
```

### WAVE A — x402 MCP funnel — **DONE**

| Step | Deliverable | Verdict |
|------|-------------|---------|
| AUDIT/SPEC/TASK | `272-274` | PASS |
| CODE | SettlementCache 120s, await settle, session bind | PASS |
| 4b | `npm test` 35/35 | PASS |
| 5b | health, pundit/info, Terminal intact | PASS |

Kill switches: `PUNDIT_X402_SETTLEMENT_CACHE_*`, `PUNDIT_X402_DELIVER_AFTER_SETTLE_*`, `PUNDIT_MCP_SESSION_BIND_*`

---

### WAVE B — Devnet escrow (hackathon priority)

#### F78N — C1 `winning_side` bound to TxLINE CPI (CRITICAL)

| Field | Value |
|-------|-------|
| Level | **L3** (funds) |
| Problem | CPI `validate_stat` may pass; `winning_side` written without decoded result link |
| Target | `solana-escrow/programs/natt_escrow/src/lib.rs` + IDL + MCP `build_escrow_settle_tx` |
| Spec direction | Decode CPI return or require TxLINE PDA/preimage; reject settle if side != oracle |
| Tests | Anchor tests + property invariants on side |
| Deploy | **new devnet program build** + migrate existing pools (documented) |
| GO gate | Owner **required** before CODE (on-chain change) |

**Without F78N:** a malicious agent can settle a pool on the wrong outcome while CPI still passes.

#### F79N — H5 `submit_signed_escrow_tx` whitelist (HIGH)

| Field | Value |
|-------|-------|
| Level | **L3** |
| Problem | `sendRawTransaction` on arbitrary bytes (fee_payer check only) |
| Target | `escrow-agent.mjs` — parse tx, allow only `natt_escrow` program ID |
| Contract | PRE: all ix target `GPSU49hP...`; POST: method in allowlist (`deposit`,`claim`,`refund`,...) |
| Kill switch | `PUNDIT_ESCROW_SUBMIT_WHITELIST_ENABLED=true` (default) |
| 4b | unit tests + malicious tx fixtures rejected |

#### F80N — H2/H3 mint + token account constraints (HIGH)

| Field | Value |
|-------|-------|
| Level | **L3** |
| Problem | arbitrary `usdc_mint` at `create_pool`; deposit ATA unconstrained |
| Target | `lib.rs` — `constraint = usdc_mint.key() == EXPECTED_DEVNET_USDC`; deposit `token::mint`, `token::authority` |
| Deploy | program redeploy + MCP constants coordination |
| Note | Devnet only; env constant documented |

**Wave B order:** F78N AUDIT → SPEC → TASK → **go** → CODE → F79N parallel spec OK → F80N can merge with F78N if same redeploy.

---

### WAVE C — Infra & economics

#### F81N — H6 hardened RPC proxy (HIGH)

| Field | Value |
|-------|-------|
| Level | **L2** |
| Surfaces | `POST /api/natt-pundit/txline/v1/solana/rpc`, `apps/web/pages/api/solana/rpc.ts` |
| Measures | JSON-RPC method allowlist; IP rate limit; reject arbitrary `sendTransaction` if not needed; body size cap |
| Kill switch | `NATT_SOLANA_RPC_PROXY_ENABLED` |
| Out of v1 scope | public mainnet proxy (disable or auth) |

#### F82N — M6 MCP rate limit (MEDIUM)

| Field | Value |
|-------|-------|
| Level | **L1** |
| Target | `nginx/nginx.conf` `limit_req_zone` on `/mcp-pundit/` |
| Smoke | initialize + tools/list under threshold OK; flood → 429 |

#### F83N — M3 hackathon vs prod bypass policy (MEDIUM)

| Field | Value |
|-------|-------|
| Level | **L1** doc + config |
| Prod state | `devnet_open_access:true` measured on `/pundit/info` |
| Action | Document in README `Design Decisions`; before jury: owner decides OFF or accepts demo |
| No code | unless owner wants default `false` post-hackathon |

---

### WAVE D — Hygiene

#### F84N — I4 position lifecycle (LOW)

- Document: no `close` = no classic revival
- Future option: `close` + zero-out `amount` (separate SPEC if owner requests)

#### SECURITY.md

- Replace stub with link to this plan + exposed surfaces + how to report

#### Terminal MCP T1 — **DONE** F85N

- SettlementCache + deliver-after-settle + session IP/UA bind ported to `mcp-signal-server.mjs`
- Deploy: `scripts/deploy-mcp-prod.sh` (mcp-server + m2m-service `--no-deps`)

---

## 4. Mandatory pipeline per feature

Each open F#NN:

```
1. AUDIT  -> 275_PLAN + XXX_AUDIT_F#NN.md (numbers + L0-L3)
2. SPEC   -> DbC + PROP + MUT or WAIVE
3. TASK   -> T-UNIT / T-PROP / deploy / smoke
4. owner go
5. CODE
6. 4b ASSURANCE (green tests, no regression)
7. DEPLOY (push -> pull VPS -> rebuild target)
8. 5b SMOKE blocking
9. 6 RUNTIME validation if L3
10. DONE + handoff update
```

| Feature | L | Tests | Mutation |
|---------|---|-------|----------|
| F77N | L3 | node:test 35 | WAIVE JS |
| F78N | L3 | Anchor + TS | mutmut scope lib.rs |
| F79N | L3 | node:test escrow | WAIVE or mut scope pure |
| F80N | L3 | Anchor | required |
| F81N | L2 | vitest/hono if added | optional |
| F82N | L1 | smoke curl | WAIVE |

---

## 5. Owner prioritization (deadline 2026-07-19)

| Rank | Feature | Why now |
|------|---------|---------|
| 1 | **F78N** C1 winning_side | Only remaining CRITICAL on demo escrow funds |
| 2 | **F79N** submit whitelist | Trivial exploit via MCP relay |
| 3 | **F80N** mint constraints | Same program redeploy as F78N |
| 4 | **F81N** RPC proxy | Infra abuse / RPC cost |
| 5 | **F82N** MCP rate limit | Cost / DoS |
| 6 | **F83N** bypass policy | Jury honesty / doc |
| — | F76N audio | **Out of security plan** — product/demo |
| — | F73N E2E agent | **Out of security plan** — after F78N+F79N |

---

## 6. What is NOT done (honest reminder — updated 2026-07-10)

- **M7 on-chain stat-key pinning** = OPEN documented (see matrix + SECURITY.md "Known limitations"); prerequisite: confirm real key pair on live TxLINE proof before pinning.
- **On-chain participant→home binding** (prevent stat_a/stat_b inversion with valid proof) = post-hackathon hardening, same family as M7.
- **F95N on-chain** = code + IDL + clients deployed; confirm devnet program upgrade (`solana program show GPSU49...` slot > 473809273).
- x402 demo bypass (`devnet_open_access`) = deliberate documented choice, not an oversight.

---

## 7. Plan verdict

**PASS** — full plan documented. Waves A–D delivered + **F95N** (C2/H7/H8) shipped 2026-07-10. **1 OPEN item documented:** M7 stat-key pinning (live proof prerequisite).

*Last update: 2026-07-10 — F95N commits `9d9c95dd` / `6dda3439` / `9ffd70ba`, devnet program upgrade in progress.*
