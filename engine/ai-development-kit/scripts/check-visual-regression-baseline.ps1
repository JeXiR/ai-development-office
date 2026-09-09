param([Parameter(Mandatory=$true)][string]$ProjectPath)

$pkgPath = Join-Path $ProjectPath "package.json"
if (-not (Test-Path $pkgPath)) {
    Write-Warning "No frontend package.json detected."
    exit 0
}

$tests = Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\.git\\' -and
        $_.Name -match '(?i)(visual|screenshot|snapshot).*\.(ts|tsx|js)$'
    }

if (-not $tests) {
    Write-Warning "No visual regression test files detected."
    exit 1
}

Write-Host "Visual regression test files detected:"
$tests | ForEach-Object { Write-Host " - $($_.FullName.Substring($ProjectPath.Length).TrimStart('\'))" }
