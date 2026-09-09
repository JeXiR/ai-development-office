param([Parameter(Mandatory=$true)][string]$ProjectPath)

$checks = @(
    @{ File = "CURSOR.md"; Marker = "AI-KIT:CURSOR-TELEMETRY:START" },
    @{ File = "CLAUDE.md"; Marker = "AI-KIT:CLAUDE-TELEMETRY:START" }
)

$errors = @()
foreach ($check in $checks) {
    $path = Join-Path $ProjectPath $check.File
    if (-not (Test-Path $path)) {
        $errors += "$($check.File) missing"
        continue
    }
    $text = Get-Content $path -Raw
    if ($text -notmatch [regex]::Escape($check.Marker)) {
        $errors += "$($check.File) telemetry managed block missing"
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Project telemetry instruction validation failed."
    $errors | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Project Cursor/Claude telemetry instruction blocks validated."
exit 0
