param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$patterns = @(
    @{type="AWS access key"; regex='AKIA[0-9A-Z]{16}'},
    @{type="Generic private key"; regex='-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'},
    @{type="Likely secret assignment"; regex='(?i)(secret|password|api[_-]?key|private[_-]?key|token)\s*[:=]\s*["''][^"'']{12,}["'']'}
)

$findings = @()

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\|\\storage\\|\\build\\|\\dist\\' -and
        $_.Name -notmatch '^\.env($|\.)'
    } |
    ForEach-Object {
        try {
            $text = Get-Content $_.FullName -Raw -ErrorAction Stop
            foreach ($p in $patterns) {
                if ($text -match $p.regex) {
                    $relative = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
                    $findings += "$($p.type): $relative"
                }
            }
        } catch {}
    }

if ($findings.Count -eq 0) {
    Write-Host "No obvious hard-coded secret patterns detected."
    exit 0
}

Write-Host "Potential secret findings (values intentionally hidden):"
$findings | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
exit 1
