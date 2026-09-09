param([Parameter(Mandatory=$true)][string]$ProjectPath)

$result = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    frameworks = @()
    test_files = @()
    counts = [ordered]@{}
}

$packagePath = Join-Path $ProjectPath "package.json"
if (Test-Path $packagePath) {
    $pkg = Get-Content $packagePath -Raw | ConvertFrom-Json
    $deps = @{}
    if ($pkg.dependencies) { $pkg.dependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
    if ($pkg.devDependencies) { $pkg.devDependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }

    foreach ($f in @("vitest","jest","@playwright/test","cypress","@testing-library/react")) {
        if ($deps.ContainsKey($f)) { $result.frameworks += $f }
    }
}

if (Test-Path (Join-Path $ProjectPath "phpunit.xml")) {
    $result.frameworks += "phpunit"
}

$patterns = @("*.test.*","*.spec.*","*Test.php")
$files = @()

foreach ($pattern in $patterns) {
    $files += Get-ChildItem $ProjectPath -Filter $pattern -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\' }
}

$files = $files | Sort-Object FullName -Unique
$result.test_files = @($files | ForEach-Object {
    $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
})

$result.counts.total = $result.test_files.Count

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null
$out = Join-Path $aiDir "test-profile.json"

$result | ConvertTo-Json -Depth 10 | Set-Content $out -Encoding UTF8

Write-Host "Detected test frameworks: $($result.frameworks -join ', ')"
Write-Host "Test files: $($result.counts.total)"
Write-Host "Profile: $out"
