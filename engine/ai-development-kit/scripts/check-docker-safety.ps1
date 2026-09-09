param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()
$dockerfiles = Get-ChildItem $ProjectPath -Filter "Dockerfile*" -File -ErrorAction SilentlyContinue

foreach ($f in $dockerfiles) {
    $text = Get-Content $f.FullName -Raw
    $rel = $f.FullName.Substring($ProjectPath.Length).TrimStart('\')

    if ($text -notmatch '(?im)^USER\s+') {
        $findings += "HIGH: no explicit non-root USER in $rel"
    }
    if ($text -match '(?im)^COPY\s+\.env') {
        $findings += "BLOCKER: .env copied into image in $rel"
    }
    if ($text -match '(?i)chmod\s+777') {
        $findings += "HIGH: chmod 777 detected in $rel"
    }
    if ($text -match '(?im)^FROM\s+[^:\s]+:latest') {
        $findings += "MEDIUM: latest base tag detected in $rel"
    }
    if ($text -notmatch '(?i)healthcheck' -and $text -notmatch '(?i)EXPOSE\s+3000|php-fpm') {
        $findings += "LOW: no obvious healthcheck in $rel"
    }
}

if ($findings.Count -eq 0) {
    Write-Host "No obvious Docker safety issues detected."
    exit 0
}

$findings | ForEach-Object { Write-Host $_ }
if ($findings -match '^BLOCKER') { exit 2 }
exit 1
