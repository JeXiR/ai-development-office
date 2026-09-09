param([Parameter(Mandatory=$true)][string]$ProjectPath)

$progress = Join-Path $ProjectPath "PROGRESS.md"
$state = Join-Path $ProjectPath "PROJECT_STATE.md"
$task = Join-Path $ProjectPath ".ai-kit\current-task.json"

$reasons = @()

if (-not (Test-Path $progress)) { $reasons += "PROGRESS missing" }
elseif ((Get-Content $progress -Raw).Length -lt 250) { $reasons += "PROGRESS empty/template-like" }

if (-not (Test-Path $state)) { $reasons += "PROJECT_STATE missing" }
elseif ((Get-Content $state -Raw).Length -lt 200) { $reasons += "PROJECT_STATE empty/template-like" }

if (-not (Test-Path $task)) { $reasons += "current-task missing" }
else {
    try {
        $t = Get-Content $task -Raw | ConvertFrom-Json
        if ($t.title -eq "Project initialization" -and $t.status -eq "todo") {
            $reasons += "current-task still initialization placeholder"
        }
    } catch { $reasons += "current-task invalid" }
}

if ($reasons.Count -gt 0) {
    Write-Host "STATE_RECONSTRUCTION_REQUIRED"
    $reasons | ForEach-Object { Write-Host " - $_" }
    exit 2
}

Write-Host "Project state baseline appears initialized."
exit 0
