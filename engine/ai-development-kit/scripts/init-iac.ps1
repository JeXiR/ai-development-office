param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [ValidateSet("aws")][string]$Provider = "aws"
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $ProjectPath "infrastructure\$Provider"

if (Test-Path $target) {
    Write-Host "IaC directory already exists: $target"
    exit 0
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
Copy-Item "$KitRoot\templates\iac\$Provider" $target -Recurse
Write-Host "Initialized IaC baseline: $target"
