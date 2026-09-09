param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Name
)

$slug = ($Name.ToLower() -replace '[^a-z0-9]+','-').Trim('-')
$featureDir = Join-Path $ProjectPath "docs\features"
New-Item -ItemType Directory -Force -Path $featureDir | Out-Null

$path = Join-Path $featureDir "$slug.md"

if (Test-Path $path) {
    Write-Host "Feature doc already exists: $path"
    exit 0
}

$content = @"
# Feature: $Name

## Status
Planned

## Goal
:

## User / business behavior
:

## Acceptance criteria
- [ ]

## Affected modules
:

## Data model
:

## API contract
:

## Frontend / mobile
:

## Authorization
:

## Tenant isolation
:

## Background jobs
:

## Storage / files
:

## External integrations
:

## Observability
:

## Tests
:

## Migration / deployment
:

## Risks
:

## Decisions
:
"@

Set-Content $path $content -Encoding UTF8
Write-Host "Created feature specification: $path"
