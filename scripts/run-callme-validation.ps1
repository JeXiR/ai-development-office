param(
  [string]$ProjectPath = "D:\laragon\www\callme"
)

$ErrorActionPreference = "Stop"
$officeRoot = Split-Path -Parent $PSScriptRoot
Set-Location $officeRoot

Write-Host "AI Development Office - CallMe Validation" -ForegroundColor Cyan
Write-Host "Project: $ProjectPath"

if (!(Test-Path $ProjectPath)) {
  Write-Host "FAIL: CallMe project path not found." -ForegroundColor Red
  exit 2
}

$env:OFFICE_PROJECT_PATH = $ProjectPath

Write-Host ""
Write-Host "[1/6] Office typecheck"
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[2/6] Office production build"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[3/6] UI/i18n audits"
npm run i18n:audit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run ui-copy:audit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[4/6] Unified beta gate"
npm run beta:gate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[5/6] CallMe validation harness"
npm run callme:validate -- "$ProjectPath"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[6/6] npm audit"
npm audit
$auditExit = $LASTEXITCODE

Write-Host ""
if ($auditExit -eq 0) {
  Write-Host "CALLME BETA VALIDATION PASS" -ForegroundColor Green
  exit 0
}

Write-Host "Functional validation passed, but npm audit reported findings." -ForegroundColor Yellow
Write-Host "Do not run npm audit fix --force automatically."
exit $auditExit
