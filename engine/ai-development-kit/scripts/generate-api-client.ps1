param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [string]$Contract = "docs\api\openapi.yaml",
    [string]$Output = "src\generated\api"
)

$contractPath = Join-Path $ProjectPath $Contract
if (-not (Test-Path $contractPath)) {
    throw "Contract not found: $contractPath"
}

$packagePath = Join-Path $ProjectPath "package.json"
if (-not (Test-Path $packagePath)) {
    throw "Typed client generator currently requires a Node/TypeScript consumer."
}

$outPath = Join-Path $ProjectPath $Output
New-Item -ItemType Directory -Force -Path $outPath | Out-Null

Push-Location $ProjectPath
try {
    npx openapi-typescript $contractPath -o (Join-Path $outPath "schema.d.ts")
    if ($LASTEXITCODE -ne 0) {
        throw "OpenAPI TypeScript generation failed."
    }
}
finally {
    Pop-Location
}

Write-Host "Generated typed API schema: $Output\schema.d.ts"
