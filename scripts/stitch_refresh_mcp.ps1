# Refresh Stitch HTTP MCP token in ~/.cursor/mcp.json (Cursor HTTP client = system certs, not Node)
$ErrorActionPreference = "Stop"
$project = "project-87fea829-0a41-452e-a91"
$mcpPath = Join-Path $env:USERPROFILE ".cursor\mcp.json"

$gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) {
  Write-Error "gcloud not found"
}

Remove-Item Env:CLOUDSDK_CONFIG -ErrorAction SilentlyContinue
$token = & $gcloud auth print-access-token 2>$null
if (-not $token -or ($token -match "ERROR")) {
  Write-Error "Token failed. Run: gcloud auth login --update-adc"
}
$token = $token.Trim()

[Environment]::SetEnvironmentVariable("STITCH_ACCESS_TOKEN", $token, "User")
$env:STITCH_ACCESS_TOKEN = $token

if (-not (Test-Path $mcpPath)) {
  Write-Error "Missing $mcpPath"
}

$config = Get-Content $mcpPath -Raw | ConvertFrom-Json
$config.mcpServers.stitch = [ordered]@{
  url = "https://stitch.googleapis.com/mcp"
  headers = [ordered]@{
    Authorization = "Bearer $token"
    "X-Goog-User-Project" = $project
    Accept = "application/json"
    "Content-Type" = "application/json"
  }
}

$config | ConvertTo-Json -Depth 10 | Set-Content $mcpPath -Encoding UTF8
Write-Host "OK stitch HTTP MCP token refreshed in $mcpPath"
Write-Host "Reload Cursor: Ctrl+Shift+P then Developer Reload Window"
