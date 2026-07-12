#!/usr/bin/env bash
# Pin transitive crates for Solana BPF cargo 1.79 (edition2024 not supported).
set -euo pipefail
cd "$(dirname "$0")/.."
rm -f Cargo.lock
cargo generate-lockfile
cargo update -p zeroize --precise 1.7.0
cargo update -p blake3 --precise 1.5.5
cargo update -p proc-macro-crate@3.5.0 --precise 3.2.0
cargo update -p indexmap --precise 2.6.0
cargo update -p unicode-segmentation --precise 1.11.0
cargo update -p zmij --precise 1.0.20
set +e
anchor build
BUILD_EXIT=$?
set -e
if [ "${BUILD_EXIT}" -ne 0 ]; then
  if [ -f target/deploy/natt_escrow.so ]; then
    echo "WARN: anchor idl build failed but natt_escrow.so present — continuing"
  else
    exit "${BUILD_EXIT}"
  fi
fi
