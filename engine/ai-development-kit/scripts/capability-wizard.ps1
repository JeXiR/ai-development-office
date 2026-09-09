param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$registry = Get-Content "$KitRoot\shared\capabilities\registry.json" -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "AI Development Kit - Capability Wizard"
Write-Host "--------------------------------------"
Write-Host ""

for ($i = 0; $i -lt $registry.capabilities.Count; $i++) {
    Write-Host "[$($i + 1)] $($registry.capabilities[$i].id)"
}

$choice = Read-Host "Select capability"
if ($choice -notmatch "^\d+$") { throw "Invalid selection." }

$idx = [int]$choice - 1
if ($idx -lt 0 -or $idx -ge $registry.capabilities.Count) { throw "Invalid selection." }

$cap = $registry.capabilities[$idx]
& "$PSScriptRoot\install-capability.ps1" -ProjectPath $ProjectPath -Capability $cap.id
