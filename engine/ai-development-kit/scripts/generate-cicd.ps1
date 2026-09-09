param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [ValidateSet("github","gitlab")][string]$Provider = "github"
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$profilePath = Join-Path $ProjectPath ".ai-kit\project-profile.json"

if (-not (Test-Path $profilePath)) {
    & "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
}

$profile = Get-Content $profilePath -Raw | ConvertFrom-Json
$det = $profile.detected

function Has-Key($obj, $name) {
    return $null -ne $obj.PSObject.Properties[$name]
}

if ($Provider -eq "github") {
    $dir = Join-Path $ProjectPath ".github\workflows"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    if (Has-Key $det "laravel") {
        Copy-Item "$KitRoot\templates\ci\github\laravel.yml" (Join-Path $dir "laravel-ci.yml") -Force
    }
    if ((Has-Key $det "next") -or (Has-Key $det "react")) {
        Copy-Item "$KitRoot\templates\ci\github\nextjs.yml" (Join-Path $dir "frontend-ci.yml") -Force
    }
    if (Has-Key $det "docker") {
        Copy-Item "$KitRoot\templates\ci\github\docker.yml" (Join-Path $dir "docker-ci.yml") -Force
    }

    Write-Host "GitHub Actions workflow baseline generated."
}
else {
    $out = Join-Path $ProjectPath ".gitlab-ci.yml"
    $parts = @()

    if (Has-Key $det "laravel") {
        $parts += Get-Content "$KitRoot\templates\ci\gitlab\laravel.yml" -Raw
    }
    if ((Has-Key $det "next") -or (Has-Key $det "react")) {
        $parts += Get-Content "$KitRoot\templates\ci\gitlab\nextjs.yml" -Raw
    }

    ($parts -join "`n`n") | Set-Content $out -Encoding UTF8
    Write-Host "GitLab CI baseline generated."
}

Write-Host "Review generated CI files before enabling production deployment."
