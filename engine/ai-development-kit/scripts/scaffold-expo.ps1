param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

& "$PSScriptRoot\check-prerequisites.ps1" -Target expo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Path $ProjectPath) {
    $items = Get-ChildItem $ProjectPath -Force -ErrorAction SilentlyContinue
    if ($items.Count -gt 0) {
        throw "Target directory is not empty: $ProjectPath"
    }
}

npx create-expo-app@latest $ProjectPath
if ($LASTEXITCODE -ne 0) { throw "Expo scaffold failed." }

Write-Host "Expo project scaffolded: $ProjectPath"
