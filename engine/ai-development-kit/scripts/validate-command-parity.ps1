param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$required = @(
  "status",
  "sync-state",
  "review-project",
  "fix-next",
  "validate",
  "continue",
  "decide",
  "handoff",
  "discover-project",
  "sync-docs"
)

$claude = Join-Path $KitRoot "adapters\claude\commands"
$cursorRules = Join-Path $KitRoot "adapters\cursor\rules"

$errors = @()

foreach ($cmd in $required) {
    $cp = Join-Path $claude ($cmd + ".md")
    if (-not (Test-Path $cp)) {
        $errors += "Claude command missing: $cmd"
    }

    # Cursor uses rules/router rather than necessarily one file per slash command.
    $needle = $cmd.Replace("-", " ")
    $found = $false
    Get-ChildItem $cursorRules -File -ErrorAction SilentlyContinue | ForEach-Object {
        if ((Get-Content $_.FullName -Raw) -match [regex]::Escape($needle)) { $found = $true }
    }
    if (-not $found) {
        $errors += "Cursor semantic command reference missing: $needle"
    }
}

if ($errors.Count -gt 0) {
    Write-Host "COMMAND PARITY FAILED"
    $errors | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Cursor/Claude command parity baseline passed."
exit 0
