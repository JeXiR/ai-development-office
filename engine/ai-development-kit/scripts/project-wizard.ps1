param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$registry = Get-Content "$KitRoot\shared\presets\registry.json" -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "AI Development Kit - Project Wizard"
Write-Host "------------------------------------"
Write-Host ""

for ($i = 0; $i -lt $registry.presets.Count; $i++) {
    Write-Host "[$($i + 1)] $($registry.presets[$i].name)"
}
Write-Host "[C] Custom baseline"
Write-Host ""

$choice = Read-Host "Select preset"

if ($choice.ToUpper() -eq "C") {
    & "$PSScriptRoot\bootstrap-project.ps1" -ProjectPath $ProjectPath -Mode new
    exit
}

if ($choice -notmatch "^\d+$") { throw "Invalid selection." }

$idx = [int]$choice - 1
if ($idx -lt 0 -or $idx -ge $registry.presets.Count) { throw "Invalid preset selection." }
$selected = $registry.presets[$idx]

Write-Host ""
Write-Host "[1] AI baseline only"
Write-Host "[2] Real framework scaffold + AI setup"
$mode = Read-Host "Choose creation mode"

if ($mode -eq "2") {
    & "$PSScriptRoot\scaffold-from-preset.ps1" -ProjectPath $ProjectPath -Preset $selected.id
} else {
    & "$PSScriptRoot\create-from-preset.ps1" -ProjectPath $ProjectPath -Preset $selected.id
}
