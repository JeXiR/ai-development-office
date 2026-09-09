param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$issues = @()

$generated = Join-Path $ProjectPath "docs\architecture\STACK.generated.md"
$declared = Join-Path $ProjectPath "docs\architecture\STACK.md"
$profile = Join-Path $ProjectPath ".ai-kit\project-profile.json"
$caps = Join-Path $ProjectPath ".ai-kit\installed-capabilities.json"

if (-not (Test-Path $profile)) {
    $issues += "Missing project profile."
}

if (-not (Test-Path $generated)) {
    $issues += "Missing generated stack profile."
}

if ((Test-Path $declared) -and (Test-Path $generated)) {
    $declaredText = Get-Content $declared -Raw
    $generatedText = Get-Content $generated -Raw

    foreach ($term in @("Laravel","Next","React","Blade","Docker","AWS","Expo","Prisma","MySQL","Postgres")) {
        $a = $declaredText -match "(?i)\b$term\b"
        $b = $generatedText -match "(?i)\b$term\b"
        if ($a -ne $b) {
            $issues += "Possible documentation drift for: $term"
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host "No obvious architecture drift detected."
    exit 0
}

Write-Host "Architecture drift findings:"
$issues | ForEach-Object { Write-Host " - $_" }
