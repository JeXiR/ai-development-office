param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $ProjectPath "PROJECT_STATE.md"
if (Test-Path $target) {
    Write-Host "PROJECT_STATE.md already exists; preserving it."
    exit 0
}
Copy-Item "$KitRoot\docs-template\PROJECT_STATE_TEMPLATE.md" $target
Write-Host "Created PROJECT_STATE.md"
