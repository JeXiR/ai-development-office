param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$aiDir = Join-Path $ProjectPath ".ai-kit"
$settingsPath = Join-Path $aiDir "settings.json"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

if (-not (Test-Path $settingsPath)) {
    [ordered]@{
        responseLanguage = "tr"
        codeLanguage = "en"
        commentsLanguage = "en"
        docsLanguage = "en"
    } | ConvertTo-Json -Depth 5 | Set-Content $settingsPath -Encoding UTF8
    Write-Host "Created .ai-kit/settings.json (responseLanguage=tr)."
    exit 0
}

try { $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json }
catch { throw "Invalid JSON in $settingsPath. Fix the file before continuing." }

$allowed = @("tr","en","de","ru","auto")
$current = [string]$settings.responseLanguage
if ([string]::IsNullOrWhiteSpace($current)) {
    $settings | Add-Member -NotePropertyName responseLanguage -NotePropertyValue "tr" -Force
} elseif ($current -notin $allowed) {
    throw "Unsupported responseLanguage '$current'. Allowed: $($allowed -join ', ')"
}

foreach ($name in @("codeLanguage","commentsLanguage","docsLanguage")) {
    if (-not $settings.PSObject.Properties[$name]) {
        $settings | Add-Member -NotePropertyName $name -NotePropertyValue "en"
    }
}
$settings | ConvertTo-Json -Depth 5 | Set-Content $settingsPath -Encoding UTF8
Write-Host "Verified .ai-kit/settings.json (responseLanguage=$($settings.responseLanguage))."
