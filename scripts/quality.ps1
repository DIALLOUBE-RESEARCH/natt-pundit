$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
npm run lint -w @natt-pundit/web
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test -w @natt-pundit/natt-core
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test -w @natt-pundit/txline-gateway
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test -w @natt-pundit/edge-api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test -w @natt-pundit/web
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test -w @natt-pundit/mcp
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "quality: PASS"
