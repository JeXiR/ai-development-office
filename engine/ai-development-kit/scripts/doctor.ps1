param(
    [string]$KitRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$ProjectPath = ""
)

Write-Host "AI Development Kit Doctor"
Write-Host "========================="

& "$PSScriptRoot\self-test.ps1" -KitRoot $KitRoot
$selfTestExit = $LASTEXITCODE
if ($selfTestExit -ne 0) {
    exit 1
}

if ($ProjectPath) {
    Write-Host ""
    Write-Host "== Project integration checks =="

    foreach ($check in @(
        "check-progress.ps1",
        "validate-project-skills.ps1",
        "check-architecture-drift.ps1"
    )) {
        $path = Join-Path $PSScriptRoot $check
        if (Test-Path $path) {
            & $path -ProjectPath $ProjectPath
            if (-not $?) {
                Write-Warning "Project integration check reported an issue: $check"
            }
        }
    }
}

Write-Host ""

if ($ProjectPath) {
    Write-Host ""
    Write-Host "== validate-project-office-tools.ps1 =="
    & "$PSScriptRoot\validate-project-office-tools.ps1" -ProjectPath $ProjectPath
    $officeToolsExit = $LASTEXITCODE
    if ($officeToolsExit -ne 0) {
        throw "Project-local Office telemetry tools validation failed."
    }
}


if ($ProjectPath) {
    Write-Host ""
    Write-Host "== validate-project-telemetry-instructions.ps1 =="
    & "$PSScriptRoot\validate-project-telemetry-instructions.ps1" -ProjectPath $ProjectPath
    if ($LASTEXITCODE -ne 0) { throw "Project telemetry instruction validation failed." }
}

Write-Host "== validate-command-parity.ps1 =="
& "$PSScriptRoot\validate-command-parity.ps1" -KitRoot $KitRoot
$commandParityExit = $LASTEXITCODE
if ($commandParityExit -ne 0) {
    throw "Command parity validation failed."
}

Write-Host ""
Write-Host "== test-behavior-contracts.ps1 =="
& "$PSScriptRoot\test-behavior-contracts.ps1" -KitRoot $KitRoot
$behaviorExit = $LASTEXITCODE
if ($behaviorExit -ne 0) {
    throw "Behavior contract tests failed."
}

$manifestPath = Join-Path $KitRoot "kit.manifest.json"
$version = "UNKNOWN"
if (Test-Path $manifestPath) {
    try {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
        $version = $manifest.version
    } catch {}
}

Write-Host ""

Write-Host ""
Write-Host "== validate-readiness-capabilities.ps1 =="
& "$PSScriptRoot\validate-readiness-capabilities.ps1" -KitRoot $KitRoot
if ($LASTEXITCODE -ne 0) { throw "Project readiness capability validation failed." }


Write-Host ""
Write-Host "== validate-capability-orchestrator.ps1 =="
& "$PSScriptRoot\validate-capability-orchestrator.ps1" -KitRoot $KitRoot
if ($LASTEXITCODE -ne 0) { throw "Capability orchestrator validation failed." }

Write-Host "AI DEVELOPMENT KIT v$version - HEALTHY"
Write-Host ""
Write-Host "Doctor completed."
exit 0

Write-Host ""
Write-Host "== validate-project-response-language.ps1 =="
& "$PSScriptRoot\validate-project-response-language.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

