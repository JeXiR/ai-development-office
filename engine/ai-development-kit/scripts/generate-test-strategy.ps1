param([Parameter(Mandatory=$true)][string]$ProjectPath)

& "$PSScriptRoot\analyze-tests.ps1" -ProjectPath $ProjectPath

$profilePath = Join-Path $ProjectPath ".ai-kit\test-profile.json"
$profile = Get-Content $profilePath -Raw | ConvertFrom-Json

$docsDir = Join-Path $ProjectPath "docs\testing"
New-Item -ItemType Directory -Force -Path $docsDir | Out-Null

$strategy = @(
    "# Test Strategy",
    "",
    "## Detected frameworks",
    ""
)

if ($profile.frameworks.Count -eq 0) {
    $strategy += "- No explicit test framework detected."
} else {
    foreach ($f in $profile.frameworks) { $strategy += "- $f" }
}

$strategy += ""
$strategy += "## Current test inventory"
$strategy += ""
$strategy += "- Test files: $($profile.counts.total)"
$strategy += ""
$strategy += "## Risk-first priorities"
$strategy += ""
$strategy += "1. Authentication / authorization"
$strategy += "2. Tenant isolation when applicable"
$strategy += "3. Money / billing / invoice flows"
$strategy += "4. Destructive writes and migrations"
$strategy += "5. External integrations"
$strategy += "6. Background jobs"
$strategy += "7. Critical frontend/mobile journeys"
$strategy += ""
$strategy += "## Recommended policy"
$strategy += ""
$strategy += "- Add regression tests for every meaningful bug fix."
$strategy += "- Prefer feature/integration tests for framework behavior."
$strategy += "- Keep E2E focused on critical end-to-end journeys."
$strategy += "- Add negative authorization and tenant-boundary tests."

$strategy | Set-Content (Join-Path $docsDir "TEST_STRATEGY.generated.md") -Encoding UTF8

Write-Host "Generated: docs/testing/TEST_STRATEGY.generated.md"
