param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [Parameter(Mandatory=$true)][string]$Preset
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$registry = Get-Content (Join-Path $KitRoot "shared\compositions\registry.json") -Raw | ConvertFrom-Json
$composition = $registry.compositions | Where-Object { $_.id -eq $Preset } | Select-Object -First 1

if (-not $composition) {
  throw "Unknown capability composition/preset: $Preset"
}

Write-Host "Scaffolding composition: $($composition.name)"
& "$PSScriptRoot\scaffold-composition.ps1" `
  -ProjectPath $ProjectPath `
  -Capabilities @($composition.capabilities)

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Install/update AI Kit project state only after the scaffold composition succeeds.
& "$PSScriptRoot\install-project.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\sync-project.ps1" -ProjectPath $ProjectPath

Write-Host "Composition scaffold + AI Development Kit integration completed."
