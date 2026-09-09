param(
  [string]$InstallPath = "$env:LOCALAPPDATA\AI-Development-Office\App"
)
$ErrorActionPreference = "Stop"
Write-Host "AI Development Office installer foundation"
Write-Host "Source: $PSScriptRoot\..\.."
Write-Host "Target: $InstallPath"

New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
$source = (Resolve-Path "$PSScriptRoot\..\..").Path

Get-ChildItem $source -Force | Where-Object {
  $_.Name -notin @("node_modules",".next",".git")
} | ForEach-Object {
  Copy-Item $_.FullName -Destination $InstallPath -Recurse -Force
}

$shortcutPath = "$env:USERPROFILE\Desktop\AI Development Office.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "$InstallPath\office.cmd"
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Save()

Write-Host "Installed. Shortcut: $shortcutPath"
