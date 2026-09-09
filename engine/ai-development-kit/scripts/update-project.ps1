param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot

& "$PSScriptRoot\ensure-project-settings.ps1" -ProjectPath $ProjectPath

if (-not (Test-Path $ProjectPath)) {
    throw "Project not found: $ProjectPath"
}

Write-Host "AI Development Kit - Updating existing project"
Write-Host "Project: $ProjectPath"
Write-Host ""

# Preserve project state/docs. Refresh only managed adapter infrastructure.
$CursorDir = Join-Path $ProjectPath ".cursor"
$ClaudeDir = Join-Path $ProjectPath ".claude"

New-Item -ItemType Directory -Force -Path "$CursorDir\rules" | Out-Null
New-Item -ItemType Directory -Force -Path "$CursorDir\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\agents" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\commands" | Out-Null

# Refresh kit-owned rules/agents/commands.
Copy-Item "$KitRoot\adapters\cursor\rules\*" "$CursorDir\rules" -Recurse -Force
Copy-Item "$KitRoot\adapters\claude\agents\*" "$ClaudeDir\agents" -Recurse -Force
Copy-Item "$KitRoot\adapters\claude\commands\*" "$ClaudeDir\commands" -Recurse -Force

# Do NOT overwrite project-authored CLAUDE.md during updates.
if (-not (Test-Path (Join-Path $ProjectPath "CLAUDE.md"))) {
    Copy-Item "$KitRoot\adapters\claude\CLAUDE.template.md" "$ProjectPath\CLAUDE.md"
}

# Re-analyze and synchronize managed skills.
& "$PSScriptRoot\sync-project.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot\validate-project-skills.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Project updated to AI Development Kit v3.5.5."
Write-Host "Existing docs, PROGRESS.md, PROJECT_STATE.md and current-task state were preserved."

& "$PSScriptRoot\ensure-project-state.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-claude-instructions.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-office-tools.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-cursor-instructions.ps1" -ProjectPath $ProjectPath
