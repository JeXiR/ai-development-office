param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

if (-not (Test-Path $ProjectPath)) { throw "Project not found: $ProjectPath" }

$profile = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    project_path = $ProjectPath
    detected = [ordered]@{}
    evidence = @()
}

function Add-Detection($key, $value, $evidence) {
    $profile.detected[$key] = $value
    $profile.evidence += $evidence
}

$composerPath = Join-Path $ProjectPath "composer.json"
if (Test-Path $composerPath) {
    $composer = Get-Content $composerPath -Raw | ConvertFrom-Json
    Add-Detection "php" $true "composer.json"
    if ($composer.require.'laravel/framework') {
        Add-Detection "laravel" $composer.require.'laravel/framework' "composer.json: laravel/framework"
    }
}

$packagePath = Join-Path $ProjectPath "package.json"
if (Test-Path $packagePath) {
    $pkg = Get-Content $packagePath -Raw | ConvertFrom-Json
    $deps = @{}
    if ($pkg.dependencies) { $pkg.dependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
    if ($pkg.devDependencies) { $pkg.devDependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }

    foreach ($name in @("react","next","typescript","tailwindcss","motion","framer-motion","gsap","three","@prisma/client","expo","react-native")) {
        if ($deps.ContainsKey($name)) { Add-Detection $name $deps[$name] "package.json: $name" }
    }
}

if (Test-Path (Join-Path $ProjectPath "prisma\schema.prisma")) {
    Add-Detection "prisma" $true "prisma/schema.prisma"
}

$dockerfiles = Get-ChildItem $ProjectPath -Filter "Dockerfile*" -File -ErrorAction SilentlyContinue
if ($dockerfiles) { Add-Detection "docker" $true "Dockerfile" }

$compose = Get-ChildItem $ProjectPath -Include "docker-compose*.yml","docker-compose*.yaml","compose*.yml","compose*.yaml" -File -ErrorAction SilentlyContinue
if ($compose) { Add-Detection "docker_compose" $true "compose file" }

if (Test-Path (Join-Path $ProjectPath "eas.json")) { Add-Detection "eas" $true "eas.json" }
if (Test-Path (Join-Path $ProjectPath "resources\views")) { Add-Detection "blade" $true "resources/views" }

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

$profilePath = Join-Path $aiDir "project-profile.json"
$profile | ConvertTo-Json -Depth 10 | Set-Content $profilePath -Encoding UTF8

$docsArch = Join-Path $ProjectPath "docs\architecture"
New-Item -ItemType Directory -Force -Path $docsArch | Out-Null
$stackPath = Join-Path $docsArch "STACK.generated.md"

$lines = @(
    "# Generated Stack Profile",
    "",
    "> Generated automatically from repository evidence.",
    "",
    "## Detected",
    ""
)
foreach ($item in $profile.detected.GetEnumerator()) {
    $lines += "- $($item.Key): $($item.Value)"
}
$lines += ""
$lines += "## Evidence"
$lines += ""
foreach ($e in $profile.evidence) { $lines += "- $e" }

$lines | Set-Content $stackPath -Encoding UTF8

Write-Host "Analysis complete."
Write-Host "Profile: $profilePath"
Write-Host "Stack:   $stackPath"
