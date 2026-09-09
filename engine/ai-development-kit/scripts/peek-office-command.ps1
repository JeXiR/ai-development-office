param([Parameter(Mandatory=$true)][string]$ProjectPath)

$file = Join-Path $ProjectPath ".ai-kit\command-requests.jsonl"
if (-not (Test-Path $file)) {
  Write-Host "No Office command queue."
  exit 0
}

$lines = Get-Content $file | Where-Object { $_.Trim() }
if ($lines.Count -eq 0) {
  Write-Host "Office command queue is empty."
  exit 0
}

$last = $lines | Select-Object -Last 1 | ConvertFrom-Json
Write-Host "Latest Office command request:"
Write-Host " - request: $($last.request_id)"
Write-Host " - command: $($last.command)"
Write-Host " - created: $($last.created_at)"
