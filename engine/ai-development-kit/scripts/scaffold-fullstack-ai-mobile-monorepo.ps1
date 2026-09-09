param([Parameter(Mandatory=$true)][string]$ProjectPath)

Write-Warning "Deprecated wrapper. v3.5.0 delegates to the capability composition orchestrator."
& "$PSScriptRoot\scaffold-from-preset.ps1" `
  -ProjectPath $ProjectPath `
  -Preset "fullstack-ai-mobile-monorepo"
exit $LASTEXITCODE
