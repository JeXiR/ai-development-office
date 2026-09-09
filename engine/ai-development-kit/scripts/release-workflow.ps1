param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Version
)

& "$PSScriptRoot\init-project-state.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\prepare-release.ps1" -ProjectPath $ProjectPath -Version $Version
& "$PSScriptRoot\check-doc-sync.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\check-release-readiness.ps1" -ProjectPath $ProjectPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Release $Version is not ready."
    exit 1
}

Write-Host "Release $Version baseline is READY for human/deployment review."
