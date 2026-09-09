param([Parameter(Mandatory=$true)][string]$ProjectPath)

$ai = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $ai | Out-Null

& "$PSScriptRoot\detect-project-capabilities.ps1" -ProjectPath $ProjectPath
$requirementsPath = Join-Path $ai "project-requirements.json"
$requirements = Get-Content $requirementsPath -Raw | ConvertFrom-Json

$graph = & "$PSScriptRoot\resolve-capability-graph.ps1" -Capabilities @($requirements.capabilities)
if ($LASTEXITCODE -eq 3) {
  $report = [ordered]@{
    schema_version="2.0"; project=(Split-Path $ProjectPath -Leaf)
    overall="CONFLICT"; scaffold_ready=$false
    required_capabilities=@($requirements.capabilities)
    next_action="Resolve capability conflicts before scaffolding."
  }
  $report | ConvertTo-Json -Depth 15 | Set-Content (Join-Path $ai "project-readiness.json") -Encoding UTF8
  exit 2
}
if ($LASTEXITCODE -ne 0) { exit 2 }

$composition = & "$PSScriptRoot\resolve-composition.ps1" -Capabilities @($graph.requested)
$catalog = & "$PSScriptRoot\read-capability-catalog.ps1"

$items = @()
$hasPartial = $false

foreach ($id in @($graph.resolved)) {
  $cap = $catalog | Where-Object { $_.id -eq $id } | Select-Object -First 1
  $status = "READY"
  $reason = $null
  $evidence = @()

  if ($cap.scaffold.mode -eq "script") {
    $scriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) $cap.scaffold.script
    if (Test-Path $scriptPath) { $evidence += $cap.scaffold.script }
    else { $status="PARTIAL"; $reason="Scaffold script missing."; $hasPartial=$true }
  } else {
    $evidence += "declarative capability"
  }

  $items += [ordered]@{
    id=$id; status=$status; evidence=$evidence; reason=$reason
  }
}

$overall = if ($hasPartial) { "PARTIAL" } else { "READY" }

$report = [ordered]@{
  schema_version = "2.0"
  project = (Split-Path $ProjectPath -Leaf)
  overall = $overall
  scaffold_ready = ($overall -eq "READY")
  detected_capabilities = @($requirements.capabilities)
  resolved_capabilities = @($graph.resolved)
  composition = $composition
  capabilities = $items
  next_action = if ($overall -eq "READY") {
    "Run scaffold-composition.ps1 with the resolved capability set."
  } else {
    "Run kit gap analysis before scaffolding."
  }
}

$report | ConvertTo-Json -Depth 20 |
  Set-Content (Join-Path $ai "project-readiness.json") -Encoding UTF8

Write-Host "Project readiness: $overall"
Write-Host "Composition: $($composition.id) [$($composition.type)]"
Write-Host "Scaffold ready: $($report.scaffold_ready)"
if (-not $report.scaffold_ready) { exit 2 }
exit 0
