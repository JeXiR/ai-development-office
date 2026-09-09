param(
  [Parameter(Mandatory=$true)][string]$Capability,
  [string]$KitRoot = (Split-Path -Parent $PSScriptRoot)
)

$catalog = & "$PSScriptRoot\read-capability-catalog.ps1" -KitRoot $KitRoot
$match = $catalog | Where-Object {
  $_.id -eq $Capability -or ($_.aliases -contains $Capability)
} | Select-Object -First 1

if (-not $match) { throw "Unknown capability: $Capability" }
$match.id
