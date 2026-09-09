param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

& "$PSScriptRoot\check-prerequisites.ps1" -Target laravel
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Path $ProjectPath) {
    $items = Get-ChildItem $ProjectPath -Force -ErrorAction SilentlyContinue
    if ($items.Count -gt 0) {
        throw "Target directory is not empty: $ProjectPath"
    }
} else {
    New-Item -ItemType Directory -Force -Path $ProjectPath | Out-Null
}

$parent = Split-Path -Parent $ProjectPath
$name = Split-Path -Leaf $ProjectPath

Push-Location $parent
try {
    composer create-project laravel/laravel $name
    if ($LASTEXITCODE -ne 0) { throw "Laravel scaffold failed." }
}
finally {
    Pop-Location
}

Write-Host "Laravel project scaffolded: $ProjectPath"
