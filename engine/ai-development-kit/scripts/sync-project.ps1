param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$aiDir = Join-Path $ProjectPath ".ai-kit"
$currentManifestPath = Join-Path $aiDir "installed-skills.json"

& "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath

$desired = @(& "$PSScriptRoot\resolve-skills.ps1" -ProjectPath $ProjectPath)
$current = @()

if (Test-Path $currentManifestPath) {
    $currentManifest = Get-Content $currentManifestPath -Raw | ConvertFrom-Json
    if ($currentManifest.skills) { $current = @($currentManifest.skills) }
}

$toAdd = @($desired | Where-Object { $_ -notin $current })
$toRemove = @($current | Where-Object { $_ -notin $desired })

Write-Host ""
Write-Host "Skill synchronization plan"
Write-Host "--------------------------"
Write-Host "Add:    $($toAdd.Count)"
$toAdd | ForEach-Object { Write-Host "  + $_" }
Write-Host "Remove: $($toRemove.Count)"
$toRemove | ForEach-Object { Write-Host "  - $_" }

# Remove only managed folders.
foreach ($name in $toRemove) {
    foreach ($rootDir in @(
        (Join-Path $ProjectPath ".cursor\skills"),
        (Join-Path $ProjectPath ".claude\skills")
    )) {
        $dest = Join-Path $rootDir $name
        $marker = Join-Path $dest ".ai-kit-managed"
        if ((Test-Path $dest) -and (Test-Path $marker)) {
            Remove-Item $dest -Recurse -Force
        }
    }
}

& "$PSScriptRoot\install-selected-skills.ps1" -ProjectPath $ProjectPath

Write-Host ""
Write-Host "Project skill synchronization complete."
