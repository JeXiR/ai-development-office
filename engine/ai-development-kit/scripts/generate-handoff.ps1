param([Parameter(Mandatory=$true)][string]$ProjectPath)

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

$progress = Join-Path $ProjectPath "PROGRESS.md"
$task = Join-Path $aiDir "current-task.json"
$out = Join-Path $aiDir "HANDOFF.md"

$taskObj = $null
if (Test-Path $task) {
    $taskObj = Get-Content $task -Raw | ConvertFrom-Json
}

$lines = @(
    "# AI Handoff",
    "",
    "## Active Task",
    ""
)

if ($taskObj) {
    $lines += "- Title: $($taskObj.title)"
    $lines += "- Status: $($taskObj.status)"
    $lines += "- Milestone: $($taskObj.milestone)"
    $lines += "- Next action: $($taskObj.next_action)"
} else {
    $lines += "- No current-task.json found."
}

$lines += ""
$lines += "## Project Progress"
$lines += ""
if (Test-Path $progress) {
    $lines += "Canonical state: `PROGRESS.md`"
} else {
    $lines += "WARNING: PROGRESS.md missing."
}

$lines += ""
$lines += "## Repository Verification"
$lines += ""
$lines += "- Inspect Git status/diff before continuing."
$lines += "- Re-run relevant validation; do not assume previous results remain valid."
$lines += ""
$lines += "## Next Agent"
$lines += ""
$lines += "1. Read `PROGRESS.md`."
$lines += "2. Read `.ai-kit/current-task.json`."
$lines += "3. Inspect relevant docs/repository files."
$lines += "4. Continue the first verified unfinished item."

$lines | Set-Content $out -Encoding UTF8
Write-Host "Generated handoff: $out"
