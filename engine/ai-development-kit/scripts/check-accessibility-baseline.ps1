param([Parameter(Mandatory=$true)][string]$ProjectPath)

$pkgPath = Join-Path $ProjectPath "package.json"
if (-not (Test-Path $pkgPath)) {
    Write-Warning "No frontend package.json detected."
    exit 0
}

$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$deps = @{}
if ($pkg.dependencies) { $pkg.dependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
if ($pkg.devDependencies) { $pkg.devDependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }

$hasPlaywright = $deps.ContainsKey("@playwright/test")
$hasAxe = $deps.ContainsKey("@axe-core/playwright") -or $deps.ContainsKey("axe-core")

if (-not $hasPlaywright) { Write-Warning "Playwright not detected." }
if (-not $hasAxe) { Write-Warning "axe accessibility tooling not detected." }

if ($hasPlaywright -and $hasAxe) {
    Write-Host "Accessibility automation baseline detected."
    exit 0
}

exit 1
