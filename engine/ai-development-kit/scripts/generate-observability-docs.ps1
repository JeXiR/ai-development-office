param([Parameter(Mandatory=$true)][string]$ProjectPath)

& "$PSScriptRoot\analyze-observability.ps1" -ProjectPath $ProjectPath

$docsDir = Join-Path $ProjectPath "docs\observability"
New-Item -ItemType Directory -Force -Path $docsDir | Out-Null

$profile = Get-Content (Join-Path $ProjectPath ".ai-kit\observability-profile.json") -Raw | ConvertFrom-Json

$lines = @(
    "# Observability Profile",
    "",
    "## Detected tooling",
    ""
)

if ($profile.detected.Count -eq 0) {
    $lines += "- None detected"
} else {
    foreach ($x in $profile.detected) { $lines += "- $x" }
}

$lines += ""
$lines += "## Required production signals"
$lines += ""
$lines += "- structured logs"
$lines += "- error monitoring"
$lines += "- health/readiness"
$lines += "- release/version correlation"
$lines += "- queue/job monitoring when applicable"
$lines += "- metrics/tracing when justified"

$lines | Set-Content (Join-Path $docsDir "OBSERVABILITY.generated.md") -Encoding UTF8

Write-Host "Generated: docs/observability/OBSERVABILITY.generated.md"
