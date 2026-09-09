param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()

$healthCandidates = @(
    "routes\web.php",
    "routes\api.php",
    "app\api\health",
    "app\health",
    "pages\api\health"
)

$healthFound = $false
foreach ($rel in $healthCandidates) {
    $path = Join-Path $ProjectPath $rel
    if (Test-Path $path) {
        $healthFound = $true
        break
    }
}

if (-not $healthFound) {
    $findings += "No obvious health endpoint/location detected."
}

$profilePath = Join-Path $ProjectPath ".ai-kit\observability-profile.json"
if (-not (Test-Path $profilePath)) {
    $findings += "Observability profile missing; run analyze-observability.ps1."
}

if ($findings.Count -eq 0) {
    Write-Host "Observability baseline looks present."
    exit 0
}

Write-Host "Observability baseline findings:"
$findings | ForEach-Object { Write-Host " - $_" }
exit 1
