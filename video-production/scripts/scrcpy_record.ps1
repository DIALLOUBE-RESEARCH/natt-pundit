#Requires -Version 5.1
<#
.SYNOPSIS
  Record phone via scrcpy into video-production/03_capture/mobile/
.EXAMPLE
  .\scrcpy_record.ps1 -OutName "01_fixtures_core"
#>
param(
  [string]$OutName = "capture",
  [int]$MaxSize = 1920,
  [string]$BitRate = "12M",
  [int]$MaxFps = 60
)

$ScrcpyDir = "C:\scrcpy"
$Scrcpy = Join-Path $ScrcpyDir "scrcpy.exe"
$Adb = Join-Path $ScrcpyDir "adb.exe"
$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "03_capture\mobile"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutFile = Join-Path $OutDir "${OutName}_${Stamp}.mp4"

if (-not (Test-Path $Scrcpy)) {
  Write-Error "scrcpy not found at $Scrcpy - install to C:\scrcpy first"
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$env:PATH = "$ScrcpyDir;$env:PATH"

Write-Host "[scrcpy] adb devices:"
& $Adb devices

Write-Host "[scrcpy] recording -> $OutFile"
Write-Host "[scrcpy] Ctrl+C to stop"

& $Scrcpy `
  --record $OutFile `
  --max-size $MaxSize `
  --video-bit-rate $BitRate `
  --max-fps $MaxFps `
  --stay-awake

Write-Host "[scrcpy] done: $OutFile"
