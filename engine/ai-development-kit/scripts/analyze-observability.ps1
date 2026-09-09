param([Parameter(Mandatory=$true)][string]$ProjectPath)

$signals = @()

$packagePath = Join-Path $ProjectPath "package.json"
if (Test-Path $packagePath) {
    $pkg = Get-Content $packagePath -Raw | ConvertFrom-Json
    $deps = @{}
    if ($pkg.dependencies) { $pkg.dependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
    if ($pkg.devDependencies) { $pkg.devDependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }

    foreach ($name in @("@sentry/nextjs","@sentry/react","@sentry/react-native","@opentelemetry/api","pino","winston")) {
        if ($deps.ContainsKey($name)) { $signals += "$name=$($deps[$name])" }
    }
}

$composerPath = Join-Path $ProjectPath "composer.json"
if (Test-Path $composerPath) {
    $composer = Get-Content $composerPath -Raw | ConvertFrom-Json
    $deps = @{}
    if ($composer.require) { $composer.require.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }

    foreach ($name in @("sentry/sentry-laravel","open-telemetry/api","monolog/monolog")) {
        if ($deps.ContainsKey($name)) { $signals += "$name=$($deps[$name])" }
    }
}

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

@{
    generated_at = (Get-Date).ToString("o")
    detected = $signals
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $aiDir "observability-profile.json") -Encoding UTF8

Write-Host "Detected observability tooling:"
if ($signals.Count -eq 0) { Write-Host " - none detected" }
else { $signals | ForEach-Object { Write-Host " - $_" } }
