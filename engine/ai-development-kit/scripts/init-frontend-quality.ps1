param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

$budget = Join-Path $aiDir "performance-budget.json"
if (-not (Test-Path $budget)) {
    Copy-Item "$KitRoot\shared\default-performance-budget.json" $budget
}

Write-Host "Frontend quality baseline initialized."
