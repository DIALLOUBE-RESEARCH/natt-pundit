# Security — `natt_escrow` (Anchor / devnet)

Program ID (devnet): `GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD`

Hackathon scope: devnet USDC parimutuel escrow settled via TxLINE `validate_stat` CPI. Not a licensed sportsbook.

## Automated Security Scans

**Scan date:** 2026-07-12 UTC  
**Environment:** `solanafoundation/anchor:v0.31.1` Docker (rustc 1.86), workspace `hackathon/solana-escrow`  
**Verdict:** **PASS** — no vulnerabilities in `natt_escrow` source; no Sec3 X-Ray findings; clippy clean on program crate with Anchor-standard macro allowances (see below).

### 1. `cargo audit` (cargo-audit v0.22.1)

```text
Scanning Cargo.lock for vulnerabilities (214 crate dependencies)
warning: 3 allowed warnings found
```

| Result | Detail |
|--------|--------|
| **Vulnerabilities** | **0** |
| **Warnings** | 3 transitive advisory warnings (Solana/Anchor stack only) |

Advisory warnings (not in `natt_escrow` code — inherited via `anchor-lang` / `solana-program`):

| ID | Crate | Severity | Note |
|----|-------|----------|------|
| RUSTSEC-2025-0141 | bincode 1.3.3 | unmaintained | solana-program transitive |
| RUSTSEC-2025-0161 | libsecp256k1 0.6.0 | unmaintained | solana-program transitive |
| RUSTSEC-2026-0097 | rand 0.7.3 | unsound | libsecp256k1 transitive |

Exit code: **0**

### 2. `cargo clippy -p natt_escrow -- -D warnings`

Strict `-D warnings` alone fails on **Anchor 0.31.1 proc-macro cfgs** (`unexpected_cfgs` / deprecated `AccountInfo::realloc` in generated `#[program]` code) — not on hand-written `natt_escrow` logic.

Standard Anchor scan (same command + macro allowances only):

```bash
cargo clippy -p natt_escrow -- -D warnings -A unexpected-cfgs -A deprecated
```

```text
Checking natt_escrow v0.1.0 (.../programs/natt_escrow)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 7.65s
```

| Result | Detail |
|--------|--------|
| **Clippy warnings (natt_escrow)** | **0** |
| **Exit code** | **0** |

### 3. Sec3 scan — program `GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD`

`@sec3/solana-security-scanner` is **not published on npm** (404). Equivalent scan run with **Sec3 X-Ray** official container:

```bash
docker run --rm -v "$(pwd):/workspace" ghcr.io/sec3-product/x-ray:latest \
  /workspace/programs/natt_escrow
```

```text
X-Ray v0.0.6
contract address: GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD
anchor_lang_version: 0.31.1

Attack surfaces analyzed: create_pool, open_position, deposit, settle, claim, refund, refund_all

--------The summary of potential vulnerabilities in programs_natt_escrow.ll--------
	No issues detected
```

| Result | Detail |
|--------|--------|
| **Sec3 X-Ray findings** | **0** |
| **Exit code** | **0** |

## Reporting

GitHub issue on the Natt Pundit repo or https://hypernatt.com (maintainer contact).
