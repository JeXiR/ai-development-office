param(
    [Parameter(Mandatory=$true)][string]$PlanFile
)

if (-not (Test-Path $PlanFile)) { throw "Plan text not found: $PlanFile" }

$text = Get-Content $PlanFile -Raw
$findings = @()

if ($text -match '(?m)^  # .* will be destroyed') {
    $findings += "BLOCKER: resource destruction detected"
}
if ($text -match '(?m)^  # .* must be replaced') {
    $findings += "HIGH: resource replacement detected"
}
if ($text -match '(?i)publicly_accessible\s*=\s*true') {
    $findings += "HIGH: public database exposure detected"
}
if ($text -match '(?i)0\.0\.0\.0/0' -and $text -match '(?i)security_group|ingress') {
    $findings += "HIGH: wide-open ingress may be present"
}
if ($text -match '(?i)deletion_protection\s*=\s*false') {
    $findings += "MEDIUM: deletion protection disabled"
}

if ($findings.Count -eq 0) {
    Write-Host "No obvious IaC safety blockers detected."
    exit 0
}

$findings | ForEach-Object { Write-Host $_ }
if ($findings -match '^BLOCKER') { exit 2 }
exit 1
