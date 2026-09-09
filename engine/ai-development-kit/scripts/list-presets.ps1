$KitRoot = Split-Path -Parent $PSScriptRoot
$registry = Get-Content "$KitRoot\shared\presets\registry.json" -Raw | ConvertFrom-Json

$registry.presets | ForEach-Object {
    Write-Host "$($_.id)  -  $($_.name)"
}
