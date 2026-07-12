#!/usr/bin/env bash
# F86N v2 — sync proprietary engine before VPS docker build (no node required)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/packages/natt-edge-engine"
PRIVATE="${NATT_EDGE_ENGINE_PATH:-$HOME/HYPERNATT/private/natt-edge-engine}"

if [[ ! -f "$PRIVATE/package.json" ]]; then
  echo "FATAL: missing $PRIVATE — scp engine once from owner machine"
  exit 1
fi
if grep -q "Public mirror stub" "$PRIVATE/src/index.ts" 2>/dev/null; then
  echo "FATAL: private path contains stub, not real engine"
  exit 1
fi

rm -rf "$DEST"
cp -a "$PRIVATE" "$DEST"
echo "[ensure-edge-engine] $PRIVATE -> packages/natt-edge-engine (prod ready)"
