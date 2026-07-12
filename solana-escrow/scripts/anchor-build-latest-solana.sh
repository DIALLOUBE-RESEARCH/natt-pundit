#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"
if ! command -v cargo-build-sbf >/dev/null 2>&1; then
  curl -sSfL https://release.anza.xyz/stable/install | sh
  export PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"
fi
solana --version
cargo-build-sbf --version
rm -f Cargo.lock
anchor build
