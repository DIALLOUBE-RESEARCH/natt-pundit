# Natt Escrow (F71N)

Parimutuel 1X2 escrow on Solana mainnet USDC, settled via CPI into TxLINE `validate_stat`.

## Layout

```
programs/natt_escrow/   Anchor program (create_pool, deposit, settle, claim)
scripts/                smoke_view_validate.ts (TxLINE .view() before CPI)
```

## Tests (honest — jury)

```bash
cd solana-escrow
cargo test -p natt_escrow --manifest-path programs/natt_escrow/Cargo.toml
# or: npm test
```

**Covered:** settle-critical `validate_stat` parse (live home CPI fixture in `programs/natt_escrow/fixtures/`) + reject empty/wrong-discriminator/truncated + 1X2 side mapping. Wired in public CI (`escrow-unit`).

**Not covered yet:** full localnet Anchor e2e (create_pool → deposit → settle CPI against TxLINE program on validator). Settlement verification for judges:

1. Live Solscan deposit / settle / claim — see `natt-pundit/docs/JURY_VERIFICATION.md`
2. Gateway CPI args + fail-closed knockout paths
3. `npx tsx scripts/smoke_view_validate.ts` (TxLINE `.view()` before CPI)
4. This Rust parse suite

## Prerequisites

- [Anchor 0.31.1](https://www.anchor-lang.com/docs/installation)
- Solana CLI
- TxLINE API token on gateway (`TXLINE_API_TOKEN`)

## Build

```bash
cd hackathon/solana-escrow
anchor build
cp target/idl/natt_escrow.json ../natt-pundit/apps/web/public/natt-escrow-idl.json
```

Generate program keypair (once):

```bash
anchor keys sync
```

## Gateway CPI args

```bash
# Enable escrow routes (VPS / local)
export NATT_ESCROW_ENABLED=true

curl -s "http://localhost:4001/v1/fixtures/18172280/cpi-args?outcome=home"
```

## Smoke — TxLINE validate_stat view (T4)

```bash
cd hackathon/solana-escrow
npx tsx scripts/smoke_view_validate.ts --fixture 18172280 --outcome home
```

Uses `@coral-xyz/anchor` + gateway `/cpi-args` + TxLINE IDL from `natt-pundit/apps/web/public/txline-idl.json`.

## Settle flow

1. Client fetches `/cpi-args?outcome=home|draw|away`
2. Client encodes TxLINE `validateStat` ix data (Anchor TS)
3. Client calls `natt_escrow::settle(winning_side, txline_ix_data)`
4. Winners call `claim`

## Env

| Var | Role |
|-----|------|
| `NATT_ESCROW_ENABLED` | gateway route kill switch |
| `NATT_ESCROW_PROGRAM_ID` | web client (post deploy) |
| `TXLINE_API_TOKEN` | live stat-validation |

## Security

| Check | Tool | Result (2026-07-12) |
|-------|------|---------------------|
| Dependency audit | `cargo audit` | **PASS** — 0 vulnerabilities (3 transitive Solana/Anchor advisory warnings) |
| Static analysis (Rust) | `cargo clippy -p natt_escrow` | **PASS** — 0 warnings on program crate (`-D warnings -A unexpected-cfgs -A deprecated`) |
| Solana program scan | Sec3 X-Ray v0.0.6 | **PASS** — 0 issues (`GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD`) |

Details: [SECURITY.md](./SECURITY.md)

## Legal

Dev/demo micro-stakes only — not a licensed sportsbook.
