# Stitch MCP proxy for Cursor — OAuth via system gcloud (ADC bundled fails SSL on Windows)
$ErrorActionPreference = "Stop"
$project = "project-87fea829-0a41-452e-a91"
$npx = "C:\Program Files\nodejs\npx.cmd"

$gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) {
  $found = Get-Command gcloud -ErrorAction SilentlyContinue
  if ($found) {
    $gcloud = Join-Path (Split-Path $found.Source) "gcloud.cmd"
  }
}
if (-not (Test-Path $gcloud)) {
  Write-Error "gcloud not found. Install Google Cloud SDK."
}

Remove-Item Env:CLOUDSDK_CONFIG -ErrorAction SilentlyContinue
Remove-Item Env:STITCH_API_KEY -ErrorAction SilentlyContinue
$env:GOOGLE_CLOUD_PROJECT = $project
$env:STITCH_PROJECT_ID = $project

function Get-GcloudToken {
  param([string]$GcloudPath)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $out = & $GcloudPath auth print-access-token 2>$null
  if ($LASTEXITCODE -eq 0 -and $out -and ($out -notmatch "ERROR")) {
    $ErrorActionPreference = $prev
    return ($out | Out-String).Trim()
  }
  $out = & $GcloudPath auth application-default print-access-token 2>$null
  $ErrorActionPreference = $prev
  if ($LASTEXITCODE -eq 0 -and $out -and ($out -notmatch "ERROR")) {
    return ($out | Out-String).Trim()
  }
  return $null
}

$token = Get-GcloudToken -GcloudPath $gcloud
if (-not $token) {
  Write-Error "No OAuth token. Run: gcloud auth login --update-adc"
}

$env:STITCH_ACCESS_TOKEN = $token
& $npx -y @_davideast/stitch-mcp proxy
