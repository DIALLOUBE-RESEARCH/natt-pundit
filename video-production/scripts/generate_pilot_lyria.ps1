#Requires -Version 5.1
<#
.SYNOPSIS
  Lyria pilot music via Vertex AI predict (needs gcloud auth + billing).
#>
param(
  [string]$Project = $(gcloud config get-value project 2>$null),
  [string]$Location = "us-central1"
)

$Root = Split-Path -Parent $PSScriptRoot
$BodyFile = Join-Path $Root "01_scripts\pilot_00-40_lyria.json"
$OutDir = Join-Path $Root "02_generative\lyria"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutBase = Join-Path $OutDir "pilot_underscore_$Stamp"

if (-not $Project) {
  Write-Error "No GCP project — run: gcloud config set project YOUR_PROJECT"
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$Token = gcloud auth print-access-token 2>$null
if (-not $Token) {
  Write-Error "gcloud auth failed — run: gcloud auth login"
  exit 1
}

$Url = "https://${Location}-aiplatform.googleapis.com/v1/projects/${Project}/locations/${Location}/publishers/google/models/lyria-002:predict"
Write-Host "[lyria] POST $Url"

$resp = Invoke-RestMethod -Method Post -Uri $Url `
  -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
  -InFile $BodyFile

$resp | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 "$OutBase.json"

# Lyria returns base64 audio in predictions[0].bytesBase64Encoded (field name may vary)
$pred = $resp.predictions[0]
$b64 = $pred.bytesBase64Encoded
if (-not $b64) { $b64 = $pred.audioContent }
if ($b64) {
  [IO.File]::WriteAllBytes("$OutBase.wav", [Convert]::FromBase64String($b64))
  Write-Host "[lyria] PASS -> $OutBase.wav"
} else {
  Write-Host "[lyria] response saved (check JSON for audio field): $OutBase.json"
}
