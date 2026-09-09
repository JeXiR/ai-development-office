param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$catalogPath = Join-Path $KitRoot "shared\capabilities\catalog.json"
$catalog = Get-Content $catalogPath -Raw | ConvertFrom-Json

$result = @()
foreach ($item in $catalog.capabilities) {
    $manifestPath = Join-Path $KitRoot $item.manifest
    if (-not (Test-Path $manifestPath)) {
        throw "Capability manifest missing: $($item.manifest)"
    }
    $result += (Get-Content $manifestPath -Raw | ConvertFrom-Json)
}
$result
