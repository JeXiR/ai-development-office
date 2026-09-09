param([Parameter(Mandatory=$true)][string]$ProjectPath)

$required = @("README.md","PROGRESS.md","PROJECT_STATE.md")
$issues = @()

foreach ($f in $required) {
    if (-not (Test-Path (Join-Path $ProjectPath $f))) {
        $issues += "$f missing"
    }
}

if ($issues.Count -gt 0) {
    $issues | ForEach-Object { Write-Warning $_ }
    exit 1
}

Write-Host "Core documentation files detected."
Write-Host "Semantic synchronization still requires repository-aware AI review."
