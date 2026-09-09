param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [string]$Destination = "apps\api"
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $KitRoot "templates\nestjs-api"
$target = Join-Path $ProjectPath $Destination

New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item (Join-Path $source "*") $target -Recurse -Force

Write-Host "NestJS API scaffolded at $target"
