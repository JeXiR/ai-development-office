param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [string]$Destination = "apps\worker"
)

$target = Join-Path $ProjectPath $Destination
New-Item -ItemType Directory -Force -Path $target | Out-Null

@"
# Worker Runtime

Status: scaffolded

Required before production:
- queue adapter
- retry policy
- idempotency
- graceful shutdown
- health/readiness
"@ | Set-Content (Join-Path $target "README.md") -Encoding UTF8

Write-Host "Worker runtime scaffolded at $target"
