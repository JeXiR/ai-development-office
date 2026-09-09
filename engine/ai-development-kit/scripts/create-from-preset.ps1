param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Preset
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$registry = Get-Content "$KitRoot\shared\presets\registry.json" -Raw | ConvertFrom-Json
$presetObj = $registry.presets | Where-Object { $_.id -eq $Preset } | Select-Object -First 1

if (-not $presetObj) {
    throw "Unknown preset: $Preset"
}

if (-not (Test-Path $ProjectPath)) {
    New-Item -ItemType Directory -Force -Path $ProjectPath | Out-Null
}

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

$profile = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    mode = "preset"
    preset = $presetObj.id
    backend = $presetObj.backend
    frontend = $presetObj.frontend
    database = $presetObj.database
    docker = $presetObj.docker
    cloud = $presetObj.cloud
    mobile = $presetObj.mobile
}

$profile | ConvertTo-Json -Depth 10 |
    Set-Content (Join-Path $aiDir "project-profile.json") -Encoding UTF8

$overrides = [ordered]@{
    include = @($presetObj.skills_include)
    exclude = @()
    pin = @()
}
$overrides | ConvertTo-Json -Depth 10 |
    Set-Content (Join-Path $aiDir "skill-overrides.json") -Encoding UTF8

& "$PSScriptRoot\install-project.ps1" -ProjectPath $ProjectPath

if ($presetObj.docker -eq $true) {
    if ($presetObj.database -eq "mysql") {
        Copy-Item "$KitRoot\templates\_shared\docker\docker-compose.mysql.yml" `
            (Join-Path $ProjectPath "compose.ai-kit.example.yml") -Force
    }
    elseif ($presetObj.database -eq "postgres") {
        Copy-Item "$KitRoot\templates\_shared\docker\docker-compose.postgres.yml" `
            (Join-Path $ProjectPath "compose.ai-kit.example.yml") -Force
    }

    if ($presetObj.backend -eq "laravel") {
        Copy-Item "$KitRoot\templates\_shared\docker\Dockerfile.laravel" `
            (Join-Path $ProjectPath "Dockerfile.ai-kit.example") -Force
    }
    elseif ($presetObj.backend -eq "nextjs") {
        Copy-Item "$KitRoot\templates\_shared\docker\Dockerfile.nextjs" `
            (Join-Path $ProjectPath "Dockerfile.ai-kit.example") -Force
    }
}

Write-Host ""
Write-Host "Preset baseline created: $($presetObj.name)"
Write-Host "Project: $ProjectPath"
Write-Host ""
Write-Host "Next: scaffold the actual framework/app, then run sync-project.ps1."
