param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$errors = @()

foreach ($dir in @(
    "adapters\cursor\rules",
    "adapters\claude\agents",
    "adapters\claude\commands"
)) {
    if (-not (Test-Path (Join-Path $KitRoot $dir))) {
        $errors += "Missing adapter directory: $dir"
    }
}

$installer = Join-Path $KitRoot "scripts\install-selected-skills.ps1"
if (-not (Test-Path $installer)) {
    $errors += "Selective skill installer missing."
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Adapter parity baseline passed."
