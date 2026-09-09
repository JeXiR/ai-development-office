param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $ProjectPath "PROGRESS.md"

if (Test-Path $target) {
    Write-Host "PROGRESS.md already exists; preserving it."
    exit 0
}

Copy-Item "$KitRoot\shared\templates\PROGRESS.md" $target
Write-Host "Created project progress file: $target"
