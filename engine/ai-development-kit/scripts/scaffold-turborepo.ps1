param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
Copy-Item (Join-Path $KitRoot "templates\turborepo\turbo.json") (Join-Path $ProjectPath "turbo.json") -Force
Write-Host "Turborepo scaffolded."
