param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$manifest = Get-Content (Join-Path $KitRoot "kit.manifest.json") -Raw | ConvertFrom-Json
$version = $manifest.version

$readme = Get-Content (Join-Path $KitRoot "README.md") -Raw
if ($readme -notmatch [regex]::Escape("v$version") -and $readme -notmatch [regex]::Escape("v3.0")) {
    Write-Warning "README may not mention current version $version."
}

Write-Host "Manifest version: $version"
