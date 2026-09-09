param(
  [string]$ProjectPath = "D:\laragon\www\callme",
  [switch]$PauseOnExit
)

$ErrorActionPreference = "Stop"
$officeRoot = Split-Path -Parent $PSScriptRoot
Set-Location $officeRoot
$env:OFFICE_PROJECT_PATH = $ProjectPath

function Finish-WithPause([int]$Code) {
  if ($PauseOnExit) {
    Write-Host ""
    Read-Host "Press Enter to close"
  }
  exit $Code
}

function Run-Step([string]$Name, [scriptblock]$Action) {
  Write-Host ""
  Write-Host "== $Name ==" -ForegroundColor Yellow
  & $Action
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: $Name (exit $LASTEXITCODE)" -ForegroundColor Red
    Finish-WithPause $LASTEXITCODE
  }
}

Write-Host "AI Development Office - Final Acceptance" -ForegroundColor Cyan
Write-Host "Project: $ProjectPath"

if (!(Test-Path $ProjectPath)) {
  Write-Host "FAIL: Project path not found: $ProjectPath" -ForegroundColor Red
  Finish-WithPause 2
}

Run-Step "Typecheck" { npm run typecheck }
Run-Step "Production build" { npm run build }
Run-Step "RC2 gate" { npm run rc2:gate }
Run-Step "Real CallMe validation" { npm run callme:validate -- "$ProjectPath" }

Write-Host ""
Write-Host "== npm audit ==" -ForegroundColor Yellow
npm audit
$auditExit = $LASTEXITCODE

if ($auditExit -eq 0) {
  Write-Host ""
  Write-Host "FINAL ACCEPTANCE FUNCTIONAL GATES PASS" -ForegroundColor Green
  Write-Host "Complete manual security review before marking validation fully complete." -ForegroundColor Cyan
  Finish-WithPause 0
}

Write-Host ""
Write-Host "Functional gates passed, but npm audit reports findings." -ForegroundColor Yellow
Write-Host "Review exact findings. Do not run npm audit fix --force automatically."
Finish-WithPause $auditExit
