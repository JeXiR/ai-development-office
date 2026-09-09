param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$required = @(
  "scripts\check-project-readiness.ps1",
  "scripts\scaffold-pnpm-workspace.ps1",
  "scripts\scaffold-turborepo.ps1",
  "scripts\scaffold-nestjs.ps1",
  "scripts\scaffold-worker.ps1",
  "scripts\scaffold-redis.ps1",
  "scripts\scaffold-fullstack-ai-mobile-monorepo.ps1",
  "shared\contracts\PROJECT_READINESS_CONTRACT.md",
  "shared\contracts\project-readiness.schema.json"
)

$missing = @()
foreach ($rel in $required) {
  if (-not (Test-Path (Join-Path $KitRoot $rel))) { $missing += $rel }
}

if ($missing.Count -gt 0) {
  Write-Host "Readiness capability validation failed."
  $missing | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Project readiness capability baseline passed."
exit 0
