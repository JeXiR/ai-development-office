param([Parameter(Mandatory=$true)][string]$ProjectPath)

$failed = @()

& "$PSScriptRoot\validate-baseline.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "baseline validation" }

& "$PSScriptRoot\security-audit.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "security audit" }

& "$PSScriptRoot\check-migration-safety.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -eq 2) { $failed += "migration blocker" }

if ($failed.Count -gt 0) {
    Write-Host "CI local gate failures:"
    $failed | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Local CI gate passed."
