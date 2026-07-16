# Jury verification — clickable proofs

Everything below is **public**. No Natt account required. Judges can reproduce in a browser or with `curl`.

**Networks:** TxLINE data = mainnet API. Escrow USDC = **Solana devnet** (test tokens, same wallet flow as mainnet).

---

## 1. Off-chain — Merkle & CPI (30 seconds)

| What | Click to verify |
|------|-----------------|
| Merkle proof JSON | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof |
| **Local recompute** (`valid: true`) | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/proof/verify |
| CPI args — FT win (France–Morocco 2–0) | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18209181/cpi-args?outcome=home |
| CPI args — regulation draw only | https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18172280/cpi-args?outcome=draw |
| SETUP/HOLD board | https://hypernatt.com/api/natt-pundit/edge/v1/edge/summary |
| MCP tools (20) | https://hypernatt.com/mcp-pundit/pundit/info |

Fail-closed check: `.../18172280/cpi-args?outcome=home` → **502** (1–1 + pens — cannot prove home win on regulation stats alone).

---

## 2. On-chain — Solana devnet escrow

| What | Link |
|------|------|
| **Natt escrow program** | https://solscan.io/account/GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD?cluster=devnet |
| Same (Solana Explorer) | https://explorer.solana.com/address/GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD?cluster=devnet |
| Devnet USDC mint (F80N) | https://solscan.io/token/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU?cluster=devnet |

### Recent program transactions (video + prod demos)

These are **real devnet txs** touching program `GPSU49…`. Open any signature — inspect instructions (`deposit`, `settle`, `claim`, CPI `validate_stat`).

| # | Role (demo) | Solscan (devnet) |
|---|-------------|------------------|
| 1 | **Agent claim** — shown in submission video (`4S4bMc…`) | https://solscan.io/tx/4S4bMcZnwemMA5G2gEzSDg24PuvaokTGedFgmW4byxnd59m4meZfTcvkWdDZzFp4hE4yS9yB8rSrowNzs7sWYWaG?cluster=devnet |
| 2 | Pool / settle flow | https://solscan.io/tx/63Z75dTZ61KRu2haiNpPHonVfm6vJFNyL3FhtNCWZvtcTh3BfZ11PvghHTirwJo7gU7R2yqdXrLMbVdmduWtNTbL?cluster=devnet |
| 3 | Escrow interaction | https://solscan.io/tx/3BwKj5fz8xTB47aqTVhSRh79WFUszc7P7jfunuJd3pgb6sgXwrbKrbmSuMgaqGXx2yjaBvz2FbZdX4AeeUotvdxB?cluster=devnet |
| 4 | Escrow interaction | https://solscan.io/tx/4zXLckTKbamNzGn7YWmmifaguuWUYrgREtJpivr74X2m4dxGERZGrSGvc8NFm9a9YH5yqvfz4hxjYdxzgF4Aioaw?cluster=devnet |

**More txs:** Solscan → program page → **Transactions** tab (public ledger, unlimited history).

---

## 3. On-chain — TxLINE anchor (mainnet)

Settlement Merkle roots are anchored by TxLINE's on-chain program (not our escrow):

| What | Link |
|------|------|
| TxLINE program (mainnet) | https://explorer.solana.com/address/9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA |

In-app **Data Lab** → **Recent Merkle anchors** shows verified/pending rows with explorer links (same program).

---

## 4. Live UI cross-check (matches video)

| Demo in video | Where jury clicks |
|---------------|-------------------|
| Fixtures + SETUP/HOLD | https://hypernatt.com/fr/nattpundit?lang=en |
| Fan bet → result | Wallet tab after connecting Phantom (devnet) |
| Merkle green badge | Match detail → settlement proof panel |
| Agent WON + explorer | https://hypernatt.com/fr/nattpundit/agent?lang=en |
| MCP 20 tools | https://hypernatt.com/mcp-pundit/pundit/info |
| Data Lab streams | https://hypernatt.com/fr/nattpundit/datas?lang=en |

---

## 5. Fixture IDs used in docs & video

| Fixture | Match | Use |
|---------|-------|-----|
| `18172280` | Regulation 1–1 + pens | Merkle verify; CPI `outcome=draw` only |
| `18209181` | France–Morocco FT 2–0 | CPI `outcome=home` (canonical settle demo) |
| `18237038` | France–Spain | Fan bet journey in video (app UI) |

---

## 6. Self-verify checklist (2 min)

- [ ] `proof/verify` → JSON contains `"valid": true`
- [ ] `18209181/cpi-args?outcome=home` → HTTP 200 + CPI payload
- [ ] Open Solscan tx `4S4bMc…` → **Success**, program `GPSU49…`
- [ ] Agent dashboard shows bet rows; cross-check wallet on explorer
- [ ] `curl` MCP `/pundit/info` → 20 tool names

**Tests (repo):** `npm test` in public mirror — **228/228** PASS · CI badge on README.

---

## Why devnet?

Same Anchor program, CPI path, wallet signatures, and SPL USDC flow as mainnet — **without** putting real user funds at risk during a 72h hackathon window. See README *Legal / demo scope*.
