param(
  [string]$OfficePath = (Split-Path -Parent $PSScriptRoot)
)

Write-Host "Unblocking AI Development Office files..."
Get-ChildItem $OfficePath -Recurse -File | Unblock-File
Write-Host "Done."

Write-Host ""
Write-Host "Recommended execution policy:"
Write-Host "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned"
