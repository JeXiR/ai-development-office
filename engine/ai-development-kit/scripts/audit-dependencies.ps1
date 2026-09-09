param([Parameter(Mandatory=$true)][string]$ProjectPath)

Push-Location $ProjectPath
try {
    $failed = $false

    if (Test-Path "composer.json") {
        Write-Host "== Composer audit =="
        composer audit
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    }

    if (Test-Path "package.json") {
        Write-Host "== npm audit =="
        npm audit --audit-level=high
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    }

    if ($failed) { exit 1 }
    Write-Host "Dependency audit completed without high-severity command failure."
}
finally { Pop-Location }
