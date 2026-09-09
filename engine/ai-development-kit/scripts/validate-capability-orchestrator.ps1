param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$required = @(
  "shared\capabilities\catalog.json",
  "shared\compositions\registry.json",
  "shared\contracts\CAPABILITY_SCAFFOLD_ORCHESTRATOR.md",
  "scripts\detect-project-capabilities.ps1",
  "scripts\resolve-capability-graph.ps1",
  "scripts\resolve-composition.ps1",
  "scripts\scaffold-capability.ps1",
  "scripts\scaffold-composition.ps1",
  "scripts\validate-capability.ps1"
)

$missing = @()
foreach ($rel in $required) {
  if (-not (Test-Path (Join-Path $KitRoot $rel))) { $missing += $rel }
}
if ($missing.Count) {
  Write-Host "Capability orchestrator validation FAILED"
  $missing | ForEach-Object { Write-Host " - $_" }
  exit 1
}

$catalog = Get-Content (Join-Path $KitRoot "shared\capabilities\catalog.json") -Raw | ConvertFrom-Json
$ids = @($catalog.capabilities | ForEach-Object { $_.id })
$dupes = $ids | Group-Object | Where-Object { $_.Count -gt 1 }
if ($dupes) {
  Write-Host "Duplicate canonical capability IDs found."
  exit 1
}

foreach ($item in $catalog.capabilities) {
  $manifest = Join-Path $KitRoot $item.manifest
  if (-not (Test-Path $manifest)) {
    Write-Host "Capability manifest missing: $($item.manifest)"
    exit 1
  }
}

Write-Host "Capability-based scaffold orchestrator baseline passed."
exit 0
