# Stitch ADC — Windows (NE PAS copier l'URL a la main, redirect_uri_mismatch sinon)
$ErrorActionPreference = "Stop"
$project = "project-87fea829-0a41-452e-a91"

[Environment]::SetEnvironmentVariable("GOOGLE_CLOUD_PROJECT", $project, "User")
$env:GOOGLE_CLOUD_PROJECT = $project

Write-Host "Project: $project"
gcloud config set project $project

Write-Host "`n[1/4] gcloud auth login (ouvre le navigateur — localhost, pas de lien copie-colle)"
gcloud auth login --update-adc

Write-Host "`n[2/4] Quota project ADC"
gcloud auth application-default set-quota-project $project

Write-Host "`n[3/4] Activer Stitch MCP API"
gcloud beta services mcp enable stitch.googleapis.com --project=$project

Write-Host "`n[4/4] Doctor OAuth (retire STITCH_API_KEY User Windows — incompatible MCP)"
[Environment]::SetEnvironmentVariable("STITCH_API_KEY", $null, "User")
Remove-Item Env:STITCH_API_KEY -ErrorAction SilentlyContinue
$env:STITCH_API_KEY = $null
Set-Location $PSScriptRoot\..
npx -y @_davideast/stitch-mcp doctor --verbose

Write-Host "`nOK — redemarre Cursor."
