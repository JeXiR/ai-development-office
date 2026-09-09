param([Parameter(Mandatory=$true)][string]$ProjectPath)

& "$PSScriptRoot\analyze-api-contract.ps1" -ProjectPath $ProjectPath
if ($LASTEXITCODE -ne 0) { exit 1 }

$profile = Get-Content (Join-Path $ProjectPath ".ai-kit\api-contract-profile.json") -Raw | ConvertFrom-Json
$findings = @()

foreach ($rel in $profile.contracts) {
    $path = Join-Path $ProjectPath $rel
    $text = Get-Content $path -Raw

    if ($text -notmatch '(?i)openapi\s*[:"]') {
        $findings += "$rel: OpenAPI version declaration not detected."
    }
    if ($text -notmatch '(?i)paths\s*[:"]') {
        $findings += "$rel: paths section not detected."
    }
    if ($text -notmatch '(?i)(components|definitions)\s*[:"]') {
        $findings += "$rel: reusable schema/components section not detected."
    }
}

if ($findings.Count -eq 0) {
    Write-Host "Basic API contract checks passed."
    exit 0
}

Write-Host "API contract findings:"
$findings | ForEach-Object { Write-Host " - $_" }
exit 1
