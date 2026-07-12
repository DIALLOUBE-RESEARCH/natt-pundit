#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run lint -w @natt-pundit/web
npm run test -w @natt-pundit/natt-core
npm run test -w @natt-pundit/txline-gateway
npm run test -w @natt-pundit/edge-api
npm run test -w @natt-pundit/web
npm run test -w @natt-pundit/mcp
echo "quality: PASS"
