param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$required = @(
    ".ai-kit\tools\emit-office-event.ps1",
    ".ai-kit\tools\emit-office-command.ps1"
)

$missing = @()

foreach ($rel in $required) {
    $path = Join-Path $ProjectPath $rel
    if (-not (Test-Path $path)) {
        $missing += $rel
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Office telemetry tool validation failed."
    $missing | ForEach-Object { Write-Host " - missing: $_" }
    exit 1
}

Write-Host "Project-local Office telemetry tools validated."
exit 0
