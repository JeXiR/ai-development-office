param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $ProjectPath "docs\api"
New-Item -ItemType Directory -Force -Path $apiDir | Out-Null

$target = Join-Path $apiDir "openapi.yaml"

if (Test-Path $target) {
    Write-Host "OpenAPI contract already exists: $target"
    exit 0
}

Copy-Item "$KitRoot\templates\api\openapi.yaml" $target
Write-Host "Created API contract baseline: $target"
