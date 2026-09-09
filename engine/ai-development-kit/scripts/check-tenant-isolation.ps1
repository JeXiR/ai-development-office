param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()

# Lightweight heuristic checks only; not proof of safety.
Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\|\\storage\\' -and
        $_.Extension -in @(".php",".ts",".tsx",".js")
    } |
    ForEach-Object {
        try {
            $text = Get-Content $_.FullName -Raw -ErrorAction Stop
            $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')

            if ($text -match '(?i)tenant_id|tenantId') {
                if ($text -match '(?i)find\(|findOrFail\(|where\(["'']id["'']|findUnique\(' -and
                    $text -notmatch '(?i)tenant_id|tenantId') {
                    $findings += "Review possible unscoped resource lookup: $rel"
                }
            }

            if ($text -match '(?i)cache.*invoice|cache.*user|cache.*order' -and
                $text -notmatch '(?i)tenant') {
                $findings += "Review cache key for tenant namespace: $rel"
            }
        } catch {}
    }

if ($findings.Count -eq 0) {
    Write-Host "No obvious tenant isolation heuristics triggered."
    exit 0
}

Write-Host "Tenant isolation review findings:"
$findings | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
exit 1
