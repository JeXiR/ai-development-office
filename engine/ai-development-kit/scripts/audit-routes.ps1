param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()

if (Test-Path (Join-Path $ProjectPath "routes")) {
    Get-ChildItem (Join-Path $ProjectPath "routes") -Filter "*.php" -File -ErrorAction SilentlyContinue | ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')

        if ($text -match '(?i)Route::(get|post|put|patch|delete).*admin' -and
            $text -notmatch '(?i)middleware.*auth') {
            $findings += "Possible admin route without obvious auth middleware: $rel"
        }

        if ($text -match '(?i)(phpinfo|dd\(|dump\(|test|debug)') {
            $findings += "Possible debug/test route content: $rel"
        }
    }
}

if ($findings.Count -eq 0) {
    Write-Host "No obvious route exposure patterns detected."
    exit 0
}

Write-Host "Route audit findings:"
$findings | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
exit 1
