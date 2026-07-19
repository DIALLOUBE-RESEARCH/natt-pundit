# Escrow tests

## What runs today

```bash
cargo test -p natt_escrow --manifest-path programs/natt_escrow/Cargo.toml
```

Rust unit tests in `programs/natt_escrow/src/txline_ix.rs`:

- parse live TxLINE `validate_stat` home fixture (in-tree `fixtures/`)
- reject empty / wrong discriminator / truncated ix
- 1X2 comparison → side mapping

Also: `npm test` in this package runs the same cargo suite.

## What is NOT here (honest)

Full localnet `anchor test` e2e (create_pool → deposit → settle CPI against TxLINE program) is **not** automated yet — needs TxLINE program + Merkle roots on the validator. Settlement for jury = live Solscan txs + this parse suite + `scripts/smoke_view_validate.ts`.
