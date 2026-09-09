$KitRoot = Split-Path -Parent $PSScriptRoot
$registry = Get-Content "$KitRoot\shared\capabilities\registry.json" -Raw | ConvertFrom-Json

$registry.capabilities | ForEach-Object {
    Write-Host "$($_.id)"
}
