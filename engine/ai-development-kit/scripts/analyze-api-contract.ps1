param([Parameter(Mandatory=$true)][string]$ProjectPath)

$contracts = @()

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\' -and
        ($_.Name -match '(?i)(openapi|swagger).*\.(ya?ml|json)$')
    } |
    ForEach-Object {
        $contracts += $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
    }

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

@{
    generated_at = (Get-Date).ToString("o")
    contracts = $contracts
    has_contract = ($contracts.Count -gt 0)
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $aiDir "api-contract-profile.json") -Encoding UTF8

if ($contracts.Count -eq 0) {
    Write-Warning "No OpenAPI/Swagger contract detected."
    exit 1
}

Write-Host "Detected API contract(s):"
$contracts | ForEach-Object { Write-Host " - $_" }
