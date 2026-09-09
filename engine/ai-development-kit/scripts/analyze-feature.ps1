param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Feature
)

& "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\analyze-tests.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\analyze-observability.ps1" -ProjectPath $ProjectPath
& "$PSScriptRoot\analyze-api-contract.ps1" -ProjectPath $ProjectPath

$slug = ($Feature.ToLower() -replace '[^a-z0-9]+','-').Trim('-')
$doc = Join-Path $ProjectPath "docs\features\$slug.md"

Write-Host ""
Write-Host "Feature analysis context"
Write-Host "------------------------"
Write-Host "Feature doc: $doc"
Write-Host "Project profile: .ai-kit\project-profile.json"
Write-Host "Test profile: .ai-kit\test-profile.json"
Write-Host "Observability profile: .ai-kit\observability-profile.json"
Write-Host "API contract profile: .ai-kit\api-contract-profile.json"
