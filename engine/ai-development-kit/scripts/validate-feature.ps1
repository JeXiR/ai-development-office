param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Feature
)

$failed = @()

& "$PSScriptRoot\check-migration-safety.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -eq 2) { $failed += "migration blocker" }

& "$PSScriptRoot\security-audit.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "security audit" }

& "$PSScriptRoot\check-api-contract.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) {
    Write-Warning "API contract check failed or no contract exists."
}

& "$PSScriptRoot\check-test-baseline.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "test baseline" }

& "$PSScriptRoot\ci-local-check.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "CI local gate" }

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Feature completion blockers:"
    $failed | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Feature validation passed: $Feature"
