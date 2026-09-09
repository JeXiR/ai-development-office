param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $ProjectPath "infrastructure"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item (Join-Path $KitRoot "templates\redis\docker-compose.redis.yml") (Join-Path $targetDir "docker-compose.redis.yml") -Force
Write-Host "Redis compose fragment scaffolded."
