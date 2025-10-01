param(
  [string]$OutFile = "openapi.yaml",
  [string]$ApiDocsUrl = "http://localhost:8080/api/v1/openapi"
)

Write-Host "Fetching OpenAPI from $ApiDocsUrl"
$response = Invoke-RestMethod -Method GET -Uri $ApiDocsUrl -ErrorAction Stop
$targetDir = Join-Path $PSScriptRoot "..\target"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
$outPath = Join-Path $targetDir $OutFile
$response | ConvertTo-Json -Depth 99 | Out-File -FilePath $outPath -Encoding utf8
Write-Host "Saved spec to $outPath"

$frontendPublic = Join-Path $PSScriptRoot "..\..\public\openapi.yaml"
Copy-Item $outPath $frontendPublic -Force
Write-Host "Copied to $frontendPublic"

