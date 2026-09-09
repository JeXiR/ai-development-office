param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [switch]$Tailwind = $true
)

& "$PSScriptRoot\check-prerequisites.ps1" -Target nextjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Path $ProjectPath) {
    $items = Get-ChildItem $ProjectPath -Force -ErrorAction SilentlyContinue
    if ($items.Count -gt 0) {
        throw "Target directory is not empty: $ProjectPath"
    }
}

$tailwindFlag = if ($Tailwind) { "--tailwind" } else { "--no-tailwind" }

npx create-next-app@latest $ProjectPath `
    --typescript `
    --eslint `
    --app `
    $tailwindFlag `
    --use-npm `
    --import-alias "@/*"

if ($LASTEXITCODE -ne 0) { throw "Next.js scaffold failed." }

Write-Host "Next.js project scaffolded: $ProjectPath"
