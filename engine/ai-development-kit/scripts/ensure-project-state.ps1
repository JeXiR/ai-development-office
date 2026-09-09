param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

# PROGRESS
if (-not (Test-Path (Join-Path $ProjectPath "PROGRESS.md"))) {
    & "$PSScriptRoot\init-progress.ps1" -ProjectPath $ProjectPath
}

# PROJECT_STATE
if (-not (Test-Path (Join-Path $ProjectPath "PROJECT_STATE.md"))) {
    & "$PSScriptRoot\init-project-state.ps1" -ProjectPath $ProjectPath
}

# CLAUDE
if (-not (Test-Path (Join-Path $ProjectPath "CLAUDE.md"))) {
    Copy-Item "$KitRoot\adapters\claude\CLAUDE.template.md" (Join-Path $ProjectPath "CLAUDE.md")
    Write-Host "Created CLAUDE.md"
}

# CURSOR
if (-not (Test-Path (Join-Path $ProjectPath "CURSOR.md"))) {
    Copy-Item "$KitRoot\docs-template\CURSOR_TEMPLATE.md" (Join-Path $ProjectPath "CURSOR.md")
    Write-Host "Created CURSOR.md"
}

# .ai-kit + current task/profile/skills
$aiKit = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiKit | Out-Null

if (-not (Test-Path (Join-Path $aiKit "project-profile.json"))) {
    & "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
}

if (-not (Test-Path (Join-Path $aiKit "installed-skills.json"))) {
    & "$PSScriptRoot\install-selected-skills.ps1" -ProjectPath $ProjectPath
}

if (-not (Test-Path (Join-Path $aiKit "current-task.json"))) {
    & "$PSScriptRoot\update-current-task.ps1" `
        -ProjectPath $ProjectPath `
        -Title "Project initialization" `
        -Status "todo" `
        -NextAction "Review PROGRESS.md and resolve the first verified unfinished task."
}

Write-Host "Required project state files are present."

& "$PSScriptRoot\sync-claude-instructions.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-office-tools.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-cursor-instructions.ps1" -ProjectPath $ProjectPath
