param([Parameter(Mandatory=$true)][string]$ProjectPath)

$files = @(
    (Join-Path $ProjectPath "routes\console.php"),
    (Join-Path $ProjectPath "app\Console\Kernel.php")
)

$found = $false
$warnings = @()

foreach ($f in $files) {
    if (Test-Path $f) {
        $found = $true
        $text = Get-Content $f -Raw
        if ($text -match '(?i)(daily|hourly|everyMinute|schedule\()' -and
            $text -notmatch '(?i)withoutOverlapping|onOneServer') {
            $warnings += "Scheduled work detected without obvious overlap/distributed lock protection: $f"
        }
    }
}

if (-not $found) {
    Write-Host "No Laravel scheduler file detected."
    exit 0
}

if ($warnings.Count -gt 0) {
    $warnings | ForEach-Object { Write-Warning $_ }
    exit 1
}

Write-Host "Scheduler baseline safety patterns detected."
