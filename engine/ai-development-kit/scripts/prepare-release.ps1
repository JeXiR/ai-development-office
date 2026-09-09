param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Version
)

$releaseDir = Join-Path $ProjectPath "docs\releases"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
$target = Join-Path $releaseDir "$Version.md"

if (-not (Test-Path $target)) {
@"
# Release $Version

## Status
PLANNED

## Summary
:

## Added
:

## Changed
:

## Fixed
:

## Security
:

## Database / migrations
:

## API compatibility
:

## Infrastructure / Docker
:

## Configuration changes
:

## Deployment checklist
- [ ]

## Rollback plan
:

## Post-release verification
- [ ]

## Known issues
:
"@ | Set-Content $target -Encoding UTF8
}

Write-Host "Release workspace: $target"
