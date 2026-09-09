param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$SharedSkills = Join-Path $KitRoot "shared\skills"

$CursorSkills = Join-Path $ProjectPath ".cursor\skills"
$ClaudeSkills = Join-Path $ProjectPath ".claude\skills"

New-Item -ItemType Directory -Force -Path $CursorSkills | Out-Null
New-Item -ItemType Directory -Force -Path $ClaudeSkills | Out-Null

Copy-Item "$SharedSkills\*" $CursorSkills -Recurse -Force
Copy-Item "$SharedSkills\*" $ClaudeSkills -Recurse -Force

Write-Host "Skills synchronized to Cursor and Claude."
