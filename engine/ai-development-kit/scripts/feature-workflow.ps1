param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Feature
)

& "$PSScriptRoot\init-feature.ps1" -ProjectPath $ProjectPath -Name $Feature
& "$PSScriptRoot\analyze-feature.ps1" -ProjectPath $ProjectPath -Feature $Feature

Write-Host ""
Write-Host "Feature workspace initialized."
Write-Host "Implement the feature using the generated context/spec."
Write-Host "When implementation is complete run:"
Write-Host ".\scripts\validate-feature.ps1 -ProjectPath `"$ProjectPath`" -Feature `"$Feature`""
