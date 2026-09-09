param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$template = Join-Path $KitRoot "templates\pnpm-workspace\pnpm-workspace.yaml"
Copy-Item $template (Join-Path $ProjectPath "pnpm-workspace.yaml") -Force

foreach ($dir in @("apps","packages","services")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath $dir) | Out-Null
}

Write-Host "pnpm workspace scaffolded."
