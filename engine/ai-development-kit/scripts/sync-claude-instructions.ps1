param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $ProjectPath "CLAUDE.md"
$template = Join-Path $KitRoot "adapters\claude\CLAUDE.template.md"
$templateText = Get-Content $template -Raw
$start = "<!-- AI-KIT:WORKFLOW-ROUTER:START -->"
$end = "<!-- AI-KIT:WORKFLOW-ROUTER:END -->"

$s = $templateText.IndexOf($start)
$e = $templateText.IndexOf($end)
if ($s -lt 0 -or $e -lt 0) { throw "Managed workflow router block missing from CLAUDE template." }
$e += $end.Length
$managed = $templateText.Substring($s, $e - $s)

if (-not (Test-Path $target)) {
    Set-Content $target $templateText -Encoding UTF8
    Write-Host "Created CLAUDE.md with workflow router."
    exit 0
}

$current = Get-Content $target -Raw
$cs = $current.IndexOf($start)
$ce = $current.IndexOf($end)

if ($cs -ge 0 -and $ce -ge 0) {
    $ce += $end.Length
    $updated = $current.Substring(0, $cs) + $managed + $current.Substring($ce)
    Set-Content $target $updated -Encoding UTF8
    Write-Host "Updated managed AI Kit block in CLAUDE.md."
} else {
    Set-Content $target ($current.TrimEnd() + "`r`n`r`n" + $managed + "`r`n") -Encoding UTF8
    Write-Host "Added workflow router to existing CLAUDE.md."
}


# Sync Claude telemetry managed block
$telemetryStart = "<!-- AI-KIT:CLAUDE-TELEMETRY:START -->"
$telemetryEnd = "<!-- AI-KIT:CLAUDE-TELEMETRY:END -->"
$templateText = Get-Content $template -Raw
$ts = $templateText.IndexOf($telemetryStart)
$te = $templateText.IndexOf($telemetryEnd)

if ($ts -ge 0 -and $te -ge 0) {
    $te += $telemetryEnd.Length
    $telemetryManaged = $templateText.Substring($ts, $te - $ts)
    $current = Get-Content $target -Raw
    $cs = $current.IndexOf($telemetryStart)
    $ce = $current.IndexOf($telemetryEnd)

    if ($cs -ge 0 -and $ce -ge 0) {
        $ce += $telemetryEnd.Length
        $updated = $current.Substring(0, $cs) + $telemetryManaged + $current.Substring($ce)
        Set-Content $target $updated -Encoding UTF8
    } else {
        Set-Content $target ($current.TrimEnd() + "`r`n`r`n" + $telemetryManaged + "`r`n") -Encoding UTF8
    }
    Write-Host "Synced managed AI Kit telemetry block in CLAUDE.md."
}


# Sync managed response-language block
$languageStart = "<!-- AI-KIT:RESPONSE-LANGUAGE:START -->"
$languageEnd = "<!-- AI-KIT:RESPONSE-LANGUAGE:END -->"
$templateText = Get-Content $template -Raw
$ls = $templateText.IndexOf($languageStart)
$le = $templateText.IndexOf($languageEnd)
if ($ls -ge 0 -and $le -ge 0) {
    $le += $languageEnd.Length
    $languageManaged = $templateText.Substring($ls, $le - $ls)
    $current = Get-Content $target -Raw
    $cs = $current.IndexOf($languageStart)
    $ce = $current.IndexOf($languageEnd)
    if ($cs -ge 0 -and $ce -ge 0) {
        $ce += $languageEnd.Length
        $updated = $current.Substring(0, $cs) + $languageManaged + $current.Substring($ce)
        Set-Content $target $updated -Encoding UTF8
    } else {
        Set-Content $target ($current.TrimEnd() + "`r`n`r`n" + $languageManaged + "`r`n") -Encoding UTF8
    }
    Write-Host "Synced managed AI Kit response-language block in CLAUDE.md."
}
