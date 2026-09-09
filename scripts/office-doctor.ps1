$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "AI Development Office Doctor"
Write-Host "============================"
Write-Host ""

Write-Host "[PowerShell]"
Write-Host "Version: $($PSVersionTable.PSVersion)"
Write-Host "ExecutionPolicy(CurrentUser): $(Get-ExecutionPolicy -Scope CurrentUser)"
Write-Host ""

Write-Host "[Cursor CLI]"
$agent = Get-Command agent -ErrorAction SilentlyContinue
$knownAgent = Join-Path $env:LOCALAPPDATA "cursor-agent\agent.cmd"
if ($agent) {
    Write-Host "ONLINE: $($agent.Source)"
    & agent --version
} elseif (Test-Path $knownAgent) {
    Write-Host "ONLINE (known path): $knownAgent"
    & $knownAgent --version
} else {
    Write-Host "OFFLINE"
    Write-Host "Install: irm 'https://cursor.com/install?win32=true' | iex"
}
Write-Host ""

Write-Host "[Claude Code]"
$claude = Get-Command claude -ErrorAction SilentlyContinue
$knownClaude = Join-Path $env:USERPROFILE ".local\bin\claude.exe"
if ($claude) {
    Write-Host "ONLINE: $($claude.Source)"
    & claude --version
} elseif (Test-Path $knownClaude) {
    Write-Host "ONLINE (known path): $knownClaude"
    & $knownClaude --version
} else {
    Write-Host "OFFLINE"
    Write-Host "Install: irm https://claude.ai/install.ps1 | iex"
}
Write-Host ""

Write-Host "[Office files]"
$root = Split-Path -Parent $PSScriptRoot
Write-Host "Root: $root"
Write-Host "package.json: $(Test-Path (Join-Path $root 'package.json'))"
Write-Host ".env.local: $(Test-Path (Join-Path $root '.env.local'))"
Write-Host ""

Write-Host "[Persistent data]"
$data = if ($env:OFFICE_DATA_DIR) { $env:OFFICE_DATA_DIR } else { Join-Path $env:LOCALAPPDATA "AI-Development-Office" }
Write-Host $data
Write-Host "projects.json: $(Test-Path (Join-Path $data 'projects.json'))"
Write-Host "settings.json: $(Test-Path (Join-Path $data 'settings.json'))"
Write-Host "command-history.json: $(Test-Path (Join-Path $data 'command-history.json'))"
Write-Host ""

Write-Host "Doctor finished."
