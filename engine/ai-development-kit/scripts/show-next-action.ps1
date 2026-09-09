param([Parameter(Mandatory=$true)][string]$ProjectPath)

$progress = Join-Path $ProjectPath "PROGRESS.md"
$task = Join-Path $ProjectPath ".ai-kit\current-task.json"

Write-Host "AI Development Kit - Current State"
Write-Host "=================================="

if (Test-Path $task) {
    $t = Get-Content $task -Raw | ConvertFrom-Json
    Write-Host "Task:        $($t.title)"
    Write-Host "Status:      $($t.status)"
    Write-Host "Milestone:   $($t.milestone)"
    Write-Host "Next action: $($t.next_action)"
} else {
    Write-Warning "current-task.json missing."
}

if (-not (Test-Path $progress)) {
    Write-Warning "PROGRESS.md missing."
}
