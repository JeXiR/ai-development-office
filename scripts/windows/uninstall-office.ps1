param(
  [string]$InstallPath = "$env:LOCALAPPDATA\AI-Development-Office\App"
)
$shortcutPath = "$env:USERPROFILE\Desktop\AI Development Office.lnk"
if(Test-Path $shortcutPath){Remove-Item $shortcutPath -Force}
if(Test-Path $InstallPath){Remove-Item $InstallPath -Recurse -Force}
Write-Host "AI Development Office application files removed."
Write-Host "Runtime project data under LOCALAPPDATA\AI-Development-Office is not removed automatically."
