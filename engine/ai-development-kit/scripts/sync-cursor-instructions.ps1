param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $ProjectPath "CURSOR.md"
$template = Join-Path $KitRoot "docs-template\CURSOR_TEMPLATE.md"

if (-not (Test-Path $template)) { throw "CURSOR template missing: $template" }

$templateText = Get-Content $template -Raw
$start = "<!-- AI-KIT:CURSOR-TELEMETRY:START -->"
$end = "<!-- AI-KIT:CURSOR-TELEMETRY:END -->"
$s = $templateText.IndexOf($start)
$e = $templateText.IndexOf($end)
if ($s -lt 0 -or $e -lt 0) { throw "Managed Cursor telemetry block missing from template." }
$e += $end.Length
$managed = $templateText.Substring($s, $e - $s)

if (-not (Test-Path $target)) {
    Set-Content $target $templateText -Encoding UTF8
    Write-Host "Created CURSOR.md with managed telemetry block."
    exit 0
}

$current = Get-Content $target -Raw
$cs = $current.IndexOf($start)
$ce = $current.IndexOf($end)

if ($cs -ge 0 -and $ce -ge 0) {
    $ce += $end.Length
    $updated = $current.Substring(0, $cs) + $managed + $current.Substring($ce)
    Set-Content $target $updated -Encoding UTF8
    Write-Host "Updated managed AI Kit telemetry block in CURSOR.md."
} else {
    Set-Content $target ($current.TrimEnd() + "`r`n`r`n" + $managed + "`r`n") -Encoding UTF8
    Write-Host "Added managed AI Kit telemetry block to CURSOR.md."
}

# Sync managed response-language block
$languageStart = "<!-- AI-KIT:RESPONSE-LANGUAGE:START -->"
$languageEnd = "<!-- AI-KIT:RESPONSE-LANGUAGE:END -->"
$templateText = Get-Content $template -Raw
$ls = $templateText.IndexOf($languageStart)
$le = $templateText.IndexOf($languageEnd)

if ($ls -lt 0 -or $le -lt 0) {
    throw "Managed Cursor response-language block missing from template."
}

$le += $languageEnd.Length
$languageManaged = $templateText.Substring($ls, $le - $ls)
$current = Get-Content $target -Raw
$cs = $current.IndexOf($languageStart)
$ce = $current.IndexOf($languageEnd)

if ($cs -ge 0 -and $ce -ge 0) {
    $ce += $languageEnd.Length
    $updated = $current.Substring(0, $cs) + $languageManaged + $current.Substring($ce)
    Set-Content $target $updated -Encoding UTF8
    Write-Host "Updated managed AI Kit response-language block in CURSOR.md."
} else {
    Set-Content $target ($current.TrimEnd() + "`r`n`r`n" + $languageManaged + "`r`n") -Encoding UTF8
    Write-Host "Added managed AI Kit response-language block to CURSOR.md."
}

