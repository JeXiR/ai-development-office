param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$settingsPath = Join-Path $ProjectPath ".ai-kit\settings.json"
$cursorPath = Join-Path $ProjectPath "CURSOR.md"
$claudePath = Join-Path $ProjectPath "CLAUDE.md"

if (-not (Test-Path $settingsPath)) { throw "Missing project language settings: $settingsPath" }

try { $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json }
catch { throw "Invalid JSON in $settingsPath" }

$allowed = @("tr","en","de","ru","auto")
if ([string]$settings.responseLanguage -notin $allowed) {
    throw "Invalid responseLanguage '$($settings.responseLanguage)'. Allowed: $($allowed -join ', ')"
}

foreach ($file in @($cursorPath,$claudePath)) {
    if (-not (Test-Path $file)) { continue }
    $text = Get-Content $file -Raw
    if ($text -notmatch "AI-KIT:RESPONSE-LANGUAGE:START") {
        throw "Managed response-language block missing from $file"
    }
}

Write-Host "Project response language valid: $($settings.responseLanguage)"
