# Escrow tests

## What runs today

```bash
cargo test -p natt_escrow --manifest-path programs/natt_escrow/Cargo.toml
```

Rust unit tests:

- `txline_ix.rs` — parse live TxLINE `validate_stat` home fixture + reject bad ix
- `guards.rs` — settle / claim / refund / refund_all / parimutuel payout preconditions

Also: `npm test` in this package runs the same cargo suite. CI job: `escrow-unit`.

## What is NOT here (honest)

Full localnet BPF e2e (create_pool → deposit → settle CPI against TxLINE program on validator) needs Anchor CLI + a TxLINE stub/program on the validator. Settlement for jury = live Solscan txs + this suite + `scripts/smoke_view_validate.ts`.
