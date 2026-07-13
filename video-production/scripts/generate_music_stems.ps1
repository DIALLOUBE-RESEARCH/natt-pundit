#Requires -Version 5.1
<#
.SYNOPSIS
  Generate Natt Pundit music stems via Vertex Lyria-002 (Option B, 4 stems).

.EXAMPLE
  .\generate_music_stems.ps1 -Stem all
  .\generate_music_stems.ps1 -Stem 01 -Project hypernatt-prod

  Requires: gcloud auth login + billing on project. Owner must say "go lyria" first.
#>
param(
  [ValidateSet("01", "02", "03", "04", "all")]
  [string]$Stem = "all",
  [string]$Project = $(gcloud config get-value project 2>$null),
  [string]$Location = "us-central1"
)

$Root = Split-Path -Parent $PSScriptRoot
$ScriptsDir = Join-Path $Root "01_scripts"
$OutDir = Join-Path $Root "02_generative\lyria"

$StemMap = @{
  "01" = @{ Json = "lyria_01_intro.json"; Out = "music_01_intro.wav" }
  "02" = @{ Json = "lyria_02_demo.json";  Out = "music_02_demo.wav" }
  "03" = @{ Json = "lyria_03_agent.json"; Out = "music_03_agent.wav" }
  "04" = @{ Json = "lyria_04_outro.json"; Out = "music_04_outro.wav" }
}

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
$Targets = if ($Stem -eq "all") { @("01", "02", "03", "04") } else { @($Stem) }

foreach ($id in $Targets) {
  $BodyFile = Join-Path $ScriptsDir $StemMap[$id].Json
  $OutWav = Join-Path $OutDir $StemMap[$id].Out
  $Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $MetaJson = Join-Path $OutDir ("music_{0}_{1}.json" -f $id, $Stamp)

  if (-not (Test-Path $BodyFile)) {
    Write-Error "Missing $BodyFile"
    exit 1
  }

  Write-Host "[lyria] stem $id -> $OutWav"
  Write-Host "[lyria] POST $Url"

  try {
    $resp = Invoke-RestMethod -Method Post -Uri $Url `
      -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
      -InFile $BodyFile
  } catch {
    Write-Error "[lyria] FAIL stem $id : $_"
    exit 1
  }

  $resp | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 $MetaJson

  $pred = $resp.predictions[0]
  $b64 = $pred.bytesBase64Encoded
  if (-not $b64) { $b64 = $pred.audioContent }
  if ($b64) {
    [IO.File]::WriteAllBytes($OutWav, [Convert]::FromBase64String($b64))
    Write-Host "[lyria] PASS -> $OutWav"
  } else {
    Write-Error "[lyria] No audio in response — see $MetaJson"
    exit 1
  }
}

Write-Host "[lyria] Done."
