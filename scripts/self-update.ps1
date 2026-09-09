param([string]$PackagePath=$env:OFFICE_UPDATE_PACKAGE)
$ErrorActionPreference="Stop"
if([string]::IsNullOrWhiteSpace($PackagePath)){Write-Host "OFFICE_UPDATE_PACKAGE is not set.";exit 2}
if(-not(Test-Path $PackagePath)){Write-Host "Update package not found: $PackagePath";exit 3}
$OfficeRoot=Split-Path -Parent $PSScriptRoot
$BackupRoot=Join-Path $env:LOCALAPPDATA "AI-Development-Office\update-backups"
New-Item -ItemType Directory -Force -Path $BackupRoot|Out-Null
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Backup=Join-Path $BackupRoot "office-$Stamp"
New-Item -ItemType Directory -Force -Path $Backup|Out-Null
Copy-Item (Join-Path $OfficeRoot "package.json") $Backup -Force
if(Test-Path (Join-Path $OfficeRoot ".env.local")){Copy-Item (Join-Path $OfficeRoot ".env.local") $Backup -Force}
$Temp=Join-Path $env:TEMP "ai-office-update-$Stamp"
Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Temp|Out-Null
Expand-Archive -Path $PackagePath -DestinationPath $Temp -Force
$Source=Get-ChildItem $Temp -Directory|Select-Object -First 1
if(-not $Source){throw "Invalid Office ZIP."}
Get-ChildItem $Source.FullName -Force|ForEach-Object{Copy-Item $_.FullName -Destination $OfficeRoot -Recurse -Force}
Write-Host "Office updated. Backup: $Backup"
Write-Host "Run npm install and restart Office."
