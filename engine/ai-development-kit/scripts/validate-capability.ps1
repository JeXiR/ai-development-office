param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [Parameter(Mandatory=$true)][string]$Capability,
  [string]$KitRoot = (Split-Path -Parent $PSScriptRoot)
)

$catalog = & "$PSScriptRoot\read-capability-catalog.ps1" -KitRoot $KitRoot
$cap = $catalog | Where-Object { $_.id -eq $Capability } | Select-Object -First 1
if (-not $cap) { throw "Unknown capability: $Capability" }

$mode = $cap.validate.mode
if ($mode -eq "none") {
  Write-Host "[VALIDATE] $Capability -> no dedicated validator"
  exit 0
}

if ($mode -eq "files") {
  $missing = @()
  foreach ($rel in @($cap.validate.files)) {
    if (-not (Test-Path (Join-Path $ProjectPath $rel))) { $missing += $rel }
  }
  if ($missing.Count -gt 0) {
    Write-Host "[VALIDATE] $Capability FAILED"
    $missing | ForEach-Object { Write-Host " - missing: $_" }
    exit 1
  }
  Write-Host "[VALIDATE] $Capability PASSED"
  exit 0
}

if ($mode -eq "script") {
  $script = Join-Path $KitRoot $cap.validate.script
  & $script -ProjectPath $ProjectPath
  exit $LASTEXITCODE
}

throw "Unsupported validation mode for $Capability"
