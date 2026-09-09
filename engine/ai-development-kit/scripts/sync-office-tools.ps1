param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $ProjectPath ".ai-kit\tools"

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$files = @(
    "emit-office-event.ps1",
    "emit-office-command.ps1"
)

foreach ($file in $files) {
    $source = Join-Path $KitRoot ("scripts\" + $file)
    $target = Join-Path $targetDir $file

    if (-not (Test-Path $source)) {
        throw "Office telemetry source tool missing: $source"
    }

    Copy-Item $source $target -Force
    Unblock-File -Path $target -ErrorAction SilentlyContinue
}

Write-Host "Office telemetry tools synced to $targetDir"
