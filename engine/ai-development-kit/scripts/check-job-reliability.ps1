param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()
$jobsDir = Join-Path $ProjectPath "app\Jobs"

if (Test-Path $jobsDir) {
    Get-ChildItem $jobsDir -File -Recurse -Filter "*.php" | ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')

        if ($text -notmatch '(?i)\$tries|backoff|retryUntil') {
            $findings += "Review retry policy: $rel"
        }
        if ($text -notmatch '(?i)\$timeout|timeoutAt') {
            $findings += "Review timeout policy: $rel"
        }
        if ($text -match '(?i)tenant_id|tenantId' -and $text -notmatch '(?i)tenant') {
            $findings += "Review tenant context restoration: $rel"
        }
        if ($text -match '(?i)(Http::|curl|Stripe|S3|Mail::|Notification::)' -and
            $text -notmatch '(?i)unique|idempot|lock|withoutOverlapping') {
            $findings += "Review duplicate/idempotency protection for side effect: $rel"
        }
    }
}

if ($findings.Count -eq 0) {
    Write-Host "No obvious background-job reliability heuristics triggered."
    exit 0
}

Write-Host "Background job reliability findings:"
$findings | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
exit 1
