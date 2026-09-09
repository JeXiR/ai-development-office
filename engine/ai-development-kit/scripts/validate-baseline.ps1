param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

Push-Location $ProjectPath
try {
    $failed = @()

    if (Test-Path "artisan") {
        php artisan --version
        if ($LASTEXITCODE -ne 0) { $failed += "php artisan --version" }

        if (Test-Path "vendor\bin\phpunit") {
            php artisan test
            if ($LASTEXITCODE -ne 0) { $failed += "php artisan test" }
        }
    }

    if (Test-Path "package.json") {
        $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($pkg.scripts.build) {
            npm run build
            if ($LASTEXITCODE -ne 0) { $failed += "npm run build" }
        }
        if ($pkg.scripts.lint) {
            npm run lint
            if ($LASTEXITCODE -ne 0) { $failed += "npm run lint" }
        }
    }

    & "$PSScriptRoot\validate-project-skills.ps1" -ProjectPath $ProjectPath
    if ($LASTEXITCODE -ne 0) { $failed += "validate-project-skills" }

    if ($failed.Count -gt 0) {
        Write-Host "Baseline validation failures:"
        $failed | ForEach-Object { Write-Host " - $_" }
        exit 1
    }

    Write-Host "Baseline validation passed."
}
finally {
    Pop-Location
}
