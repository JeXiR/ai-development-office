param([Parameter(Mandatory=$true)][string]$ProjectPath)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker CLI not found."
    exit 1
}

$dockerfile = Join-Path $ProjectPath "Dockerfile"
if (-not (Test-Path $dockerfile)) {
    Write-Error "Dockerfile not found."
    exit 1
}

Push-Location $ProjectPath
try {
    docker build -t ai-kit-validation:local .
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
finally { Pop-Location }

Write-Host "Docker build validation passed."
