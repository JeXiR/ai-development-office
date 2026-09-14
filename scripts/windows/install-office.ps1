param(
  [string]$InstallPath = "$env:LOCALAPPDATA\AI-Development-Office\App"
)
$ErrorActionPreference = "Stop"
Write-Host "AI Development Office one-click installer"
$source = (Resolve-Path "$PSScriptRoot\..\..").Path
Write-Host "Source: $source"
Write-Host "Target: $InstallPath"

New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

$bundle = Join-Path $source "dist\office-desktop"
if (Test-Path $bundle) {
  Copy-Item "$bundle\*" -Destination $InstallPath -Recurse -Force
}

Get-ChildItem $source -Force | Where-Object {
  $_.Name -notin @(".git","dist")
} | ForEach-Object {
  Copy-Item $_.FullName -Destination $InstallPath -Recurse -Force
}

$bundledNode = Join-Path $InstallPath "runtime\node\node.exe"
if (-not (Test-Path $bundledNode)) {
  $nodeMissing = -not (Get-Command node -ErrorAction SilentlyContinue)
  if ($nodeMissing) {
    Write-Host "System Node not found. Downloading portable Node LTS..."
    $tmp = Join-Path $env:TEMP "office-node.zip"
    $url = "https://nodejs.org/dist/v22.19.0/node-v22.19.0-win-x64.zip"
    Invoke-WebRequest -Uri $url -OutFile $tmp
    $extract = Join-Path $env:TEMP "office-node"
    if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
    Expand-Archive -Path $tmp -DestinationPath $extract -Force
    $inner = Get-ChildItem $extract | Select-Object -First 1
    New-Item -ItemType Directory -Force -Path (Split-Path $bundledNode) | Out-Null
    Copy-Item (Join-Path $inner.FullName "*") -Destination (Split-Path $bundledNode) -Recurse -Force
  }
}

$launch = Join-Path $InstallPath "office-launch.cmd"
if (-not (Test-Path $launch)) {
  $launch = Join-Path $InstallPath "office.cmd"
}

$shortcutPath = "$env:USERPROFILE\Desktop\AI Development Office.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launch
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Save()

if ($env:OFFICE_CODESIGN_CERT) {
  Write-Host "Signing with OFFICE_CODESIGN_CERT..."
  $signArgs = @("sign","/fd","SHA256")
  if (Test-Path $env:OFFICE_CODESIGN_CERT) {
    $signArgs += @("/f", $env:OFFICE_CODESIGN_CERT)
    if ($env:OFFICE_CODESIGN_PASSWORD) { $signArgs += @("/p", $env:OFFICE_CODESIGN_PASSWORD) }
  } else {
    $signArgs += @("/a","/sha1", $env:OFFICE_CODESIGN_CERT)
  }
  if ($env:OFFICE_CODESIGN_TIMESTAMP) { $signArgs += @("/tr", $env:OFFICE_CODESIGN_TIMESTAMP, "/td", "SHA256") }
  Get-ChildItem $InstallPath -File | Where-Object { $_.Name -match '^office(-launch|-desktop)?\.(cmd|exe)$' } | ForEach-Object {
    & signtool @signArgs $_.FullName
  }
}

Write-Host "Installed. Shortcut: $shortcutPath"
Write-Host "User Node install is not required when runtime\\node is present."
