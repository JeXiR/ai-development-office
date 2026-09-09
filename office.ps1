$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "Created .env.local from .env.example." -ForegroundColor Yellow
    } else {
        throw ".env.local missing and .env.example was not found."
    }
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Starting AI Development Office..." -ForegroundColor Cyan
npm run office
exit $LASTEXITCODE
