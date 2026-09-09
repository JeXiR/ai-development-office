param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot

& "$PSScriptRoot\ensure-project-settings.ps1" -ProjectPath $ProjectPath
$CursorDir = Join-Path $ProjectPath ".cursor"
$ClaudeDir = Join-Path $ProjectPath ".claude"
$DocsDir = Join-Path $ProjectPath "docs"
$AiDir = Join-Path $ProjectPath ".ai-kit"

New-Item -ItemType Directory -Force -Path "$CursorDir\rules" | Out-Null
New-Item -ItemType Directory -Force -Path "$CursorDir\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\agents" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\commands" | Out-Null
New-Item -ItemType Directory -Force -Path $AiDir | Out-Null

Copy-Item "$KitRoot\adapters\cursor\rules\*" "$CursorDir\rules" -Recurse -Force
Copy-Item "$KitRoot\adapters\claude\agents\*" "$ClaudeDir\agents" -Recurse -Force
Copy-Item "$KitRoot\adapters\claude\commands\*" "$ClaudeDir\commands" -Recurse -Force
Copy-Item "$KitRoot\adapters\claude\CLAUDE.template.md" "$ProjectPath\CLAUDE.md" -Force

if (-not (Test-Path $DocsDir)) {
    Copy-Item "$KitRoot\docs-template" $DocsDir -Recurse
} else {
    Get-ChildItem "$KitRoot\docs-template" -File -Recurse | ForEach-Object {
        $relative = $_.FullName.Substring((Join-Path $KitRoot "docs-template").Length).TrimStart('\')
        $target = Join-Path $DocsDir $relative
        if (-not (Test-Path $target)) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
            Copy-Item $_.FullName $target
        }
    }
}

$overridePath = Join-Path $AiDir "skill-overrides.json"
if (-not (Test-Path $overridePath)) {
    Copy-Item "$KitRoot\shared\default-skill-overrides.json" $overridePath
}

if (-not (Test-Path (Join-Path $AiDir "project-profile.json"))) {
    & "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
}

& "$PSScriptRoot\install-selected-skills.ps1" -ProjectPath $ProjectPath


& "$PSScriptRoot\init-progress.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\init-project-state.ps1" -ProjectPath $ProjectPath

if (-not (Test-Path (Join-Path $ProjectPath ".ai-kit\current-task.json"))) {
    & "$PSScriptRoot\set-current-task.ps1" `
        -ProjectPath $ProjectPath `
        -Title "Project initialization" `
        -Milestone "Setup" `
        -Status "todo" `
        -NextAction "Review PROGRESS.md and set the first real project task."
}

Write-Host "AI Development Kit v3.5.5 installed into $ProjectPath"


& "$PSScriptRoot\ensure-project-state.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-claude-instructions.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-office-tools.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-cursor-instructions.ps1" -ProjectPath $ProjectPath
