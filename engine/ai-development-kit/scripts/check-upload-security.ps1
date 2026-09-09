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

            if ($text -match '(?i)(upload|putFile|storeAs|multipart|FormData)') {
                if ($text -notmatch '(?i)mimes|mimetypes|max:|size|file\||validate|schema|zod') {
                    $findings += "Review upload validation (type/size): $rel"
                }
                if ($text -match '(?i)public' -and $text -notmatch '(?i)authorize|policy|permission') {
                    $findings += "Review public file exposure/authorization: $rel"
                }
            }
        } catch {}
    }

if ($findings.Count -eq 0) {
    Write-Host "No obvious upload-security heuristics triggered."
    exit 0
}

Write-Host "Upload security findings:"
$findings | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
exit 1
