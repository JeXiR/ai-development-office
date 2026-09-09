param([Parameter(Mandatory=$true)][string]$ProjectPath)

$progress = Join-Path $ProjectPath "PROGRESS.md"
$task = Join-Path $ProjectPath ".ai-kit\current-task.json"

$issues = @()

if (-not (Test-Path $progress)) { $issues += "PROGRESS.md missing." }
if (-not (Test-Path $task)) { $issues += ".ai-kit/current-task.json missing." }

if (Test-Path $progress) {
    $text = Get-Content $progress -Raw
    foreach ($section in @(
        "## Completed",
        "## In Progress",
        "## Todo",
        "## Bugs / Errors",
        "## Technical Debt / Improvements",
        "## Blockers",
        "## Validation",
        "## Next Actions"
    )) {
        if ($text -notmatch [regex]::Escape($section)) {
            $issues += "PROGRESS.md missing section: $section"
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host "Project progress state looks valid."
    exit 0
}

Write-Host "Progress state findings:"
$issues | ForEach-Object { Write-Host " - $_" }
exit 1
