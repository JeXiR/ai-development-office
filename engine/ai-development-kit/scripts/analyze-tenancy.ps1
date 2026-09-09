param([Parameter(Mandatory=$true)][string]$ProjectPath)

$signals = @()

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\|\\storage\\' } |
    ForEach-Object {
        try {
            $text = Get-Content $_.FullName -Raw -ErrorAction Stop
            if ($text -match '(?i)tenant_id|tenantId|currentTenant|resolveTenant|tenancy') {
                $signals += $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
            }
        } catch {}
    }

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

@{
    generated_at = (Get-Date).ToString("o")
    tenancy_signals = @($signals | Sort-Object -Unique)
    detected = ($signals.Count -gt 0)
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $aiDir "tenancy-profile.json") -Encoding UTF8

Write-Host "Tenancy signals: $($signals.Count)"
