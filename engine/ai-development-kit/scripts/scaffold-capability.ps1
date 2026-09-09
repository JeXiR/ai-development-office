param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [Parameter(Mandatory=$true)][string]$Capability,
  [string]$KitRoot = (Split-Path -Parent $PSScriptRoot)
)

$catalog = & "$PSScriptRoot\read-capability-catalog.ps1" -KitRoot $KitRoot
$cap = $catalog | Where-Object { $_.id -eq $Capability } | Select-Object -First 1
if (-not $cap) { throw "Unknown capability: $Capability" }

if ($cap.scaffold.mode -eq "none") {
  Write-Host "[SCAFFOLD] $Capability -> declarative/no direct scaffold"
  exit 0
}

$script = Join-Path $KitRoot $cap.scaffold.script
if (-not (Test-Path $script)) { throw "Scaffold script missing for $Capability : $($cap.scaffold.script)" }

$params = @{ ProjectPath = $ProjectPath }
foreach ($property in $cap.scaffold.arguments.PSObject.Properties) {
  $params[$property.Name] = $property.Value
}

Write-Host "[SCAFFOLD] $Capability"
& $script @params
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
exit 0
