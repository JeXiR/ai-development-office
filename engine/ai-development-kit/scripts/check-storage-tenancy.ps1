param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\|\\storage\\' -and
        $_.Extension -in @(".php",".ts",".tsx",".js")
    } | ForEach-Object {
        try {
            $text = Get-Content $_.FullName -Raw
            $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')

            if ($text -match '(?i)Storage::|s3|objectKey|putFile|signedUrl|temporaryUrl' -and
                $text -match '(?i)tenant_id|tenantId|tenant') {
                # signal only
            }
            elseif ($text -match '(?i)Storage::|temporaryUrl|signedUrl' -and
                    $text -notmatch '(?i)tenant') {
                $findings += "Review tenant namespace/authorization for storage access: $rel"
            }
        } catch {}
    }

if ($findings.Count -eq 0) {
    Write-Host "No obvious storage-tenancy heuristics triggered."
    exit 0
}

$findings | Sort-Object -Unique | ForEach-Object { Write-Warning $_ }
exit 1
