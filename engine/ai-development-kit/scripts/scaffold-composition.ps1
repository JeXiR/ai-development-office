param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [Parameter(Mandatory=$true)][string[]]$Capabilities
)

$ai = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $ai | Out-Null

$graph = & "$PSScriptRoot\resolve-capability-graph.ps1" -Capabilities $Capabilities
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$composition = & "$PSScriptRoot\resolve-composition.ps1" -Capabilities @($graph.requested)

$plan = [ordered]@{
  schema_version = "1.0"
  composition = $composition
  requested = @($graph.requested)
  ordered_capabilities = @($graph.resolved)
  status = "planned"
}
$planPath = Join-Path $ai "scaffold-plan.json"
$plan | ConvertTo-Json -Depth 15 | Set-Content $planPath -Encoding UTF8

Write-Host "Composition: $($composition.id) [$($composition.type)]"
Write-Host "Execution order:"
$graph.resolved | ForEach-Object { Write-Host " - $_" }

# Execute capability-by-capability.
foreach ($cap in @($graph.resolved)) {
  & "$PSScriptRoot\scaffold-capability.ps1" -ProjectPath $ProjectPath -Capability $cap
  if ($LASTEXITCODE -ne 0) {
    $plan.status = "failed"
    $plan.failed_capability = $cap
    $plan | ConvertTo-Json -Depth 15 | Set-Content $planPath -Encoding UTF8
    exit 1
  }

  & "$PSScriptRoot\validate-capability.ps1" -ProjectPath $ProjectPath -Capability $cap
  if ($LASTEXITCODE -ne 0) {
    $plan.status = "validation_failed"
    $plan.failed_capability = $cap
    $plan | ConvertTo-Json -Depth 15 | Set-Content $planPath -Encoding UTF8
    exit 1
  }
}

$plan.status = "scaffolded"
$plan | ConvertTo-Json -Depth 15 | Set-Content $planPath -Encoding UTF8

Write-Host "Capability composition scaffold completed."
