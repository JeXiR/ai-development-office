param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$manifestPath = Join-Path $ProjectPath ".ai-kit\installed-skills.json"
if (-not (Test-Path $manifestPath)) {
    throw "installed-skills.json not found."
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$errors = @()

foreach ($name in $manifest.skills) {
    $cursor = Join-Path $ProjectPath ".cursor\skills\$name\SKILL.md"
    $claude = Join-Path $ProjectPath ".claude\skills\$name\SKILL.md"
    if (-not (Test-Path $cursor)) { $errors += "Cursor missing: $name" }
    if (-not (Test-Path $claude)) { $errors += "Claude missing: $name" }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Cursor/Claude parity validated for $($manifest.skills.Count) skills."
