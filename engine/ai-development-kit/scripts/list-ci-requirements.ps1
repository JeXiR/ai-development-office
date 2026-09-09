param([Parameter(Mandatory=$true)][string]$ProjectPath)

Write-Host "Typical CI secret/config requirements:"
Write-Host "- deployment credentials (only if deploy job enabled)"
Write-Host "- registry credentials (only if pushing images)"
Write-Host "- environment-specific application secrets"
Write-Host ""
Write-Host "Never copy production secret values into repository files."
