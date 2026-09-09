param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$checks = @(
    "validate-json.ps1",
    "validate-skill-registry.ps1",
    "validate-reference-integrity.ps1",
    "validate-adapter-parity.ps1",
    "validate-version-consistency.ps1"
)

$failed = @()

foreach ($check in $checks) {
    Write-Host ""
    Write-Host "== $check =="

    $scriptPath = Join-Path $PSScriptRoot $check

    try {
        & $scriptPath -KitRoot $KitRoot
        $success = $?

        if (-not $success) {
            $failed += $check
        }
    }
    catch {
        Write-Error $_
        $failed += $check
    }
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "SELF TEST FAILED"
    $failed | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host ""
Write-Host "SELF TEST PASSED"
exit 0
