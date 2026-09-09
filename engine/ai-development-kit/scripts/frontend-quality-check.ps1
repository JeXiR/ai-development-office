param([Parameter(Mandatory=$true)][string]$ProjectPath)

$failed = @()

& "$PSScriptRoot\check-performance-budget.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "performance budget" }

& "$PSScriptRoot\check-accessibility-baseline.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "accessibility baseline" }

& "$PSScriptRoot\check-visual-regression-baseline.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { $failed += "visual regression baseline" }

if ($failed.Count -gt 0) {
    Write-Host "Frontend quality gaps:"
    $failed | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Frontend quality baseline passed."
