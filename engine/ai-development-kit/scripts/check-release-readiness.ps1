param([Parameter(Mandatory=$true)][string]$ProjectPath)

$failed = @()

$checks = @(
    "check-progress.ps1",
    "check-migration-safety.ps1",
    "security-audit.ps1",
    "check-test-baseline.ps1",
    "ci-local-check.ps1"
)

foreach ($check in $checks) {
    $path = Join-Path $PSScriptRoot $check
    if (Test-Path $path) {
        & $path -ProjectPath $ProjectPath
        if ($LASTEXITCODE -ne 0) { $failed += $check }
    }
}

if (Test-Path (Join-Path $ProjectPath "Dockerfile")) {
    & "$PSScriptRoot\check-docker-safety.ps1" -ProjectPath $ProjectPath
    if ($LASTEXITCODE -eq 2) { $failed += "docker blocker" }
}

if (Test-Path (Join-Path $ProjectPath "infrastructure")) {
    & "$PSScriptRoot\validate-iac.ps1" -ProjectPath $ProjectPath
    if ($LASTEXITCODE -ne 0) { $failed += "IaC validation" }
}

if ($failed.Count -gt 0) {
    Write-Host "RELEASE BLOCKED"
    $failed | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "RELEASE READY baseline passed."
