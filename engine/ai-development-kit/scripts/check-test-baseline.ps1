param([Parameter(Mandatory=$true)][string]$ProjectPath)

& "$PSScriptRoot\analyze-tests.ps1" -ProjectPath $ProjectPath

$profile = Get-Content (Join-Path $ProjectPath ".ai-kit\test-profile.json") -Raw | ConvertFrom-Json

if ($profile.counts.total -eq 0) {
    Write-Warning "No test files detected."
    exit 1
}

Write-Host "Test baseline detected with $($profile.counts.total) test file(s)."
exit 0
