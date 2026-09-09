param([Parameter(Mandatory=$true)][string]$ProjectPath)

$docs = Join-Path $ProjectPath "docs\architecture\FILE_STORAGE.md"
if (-not (Test-Path $docs)) {
    Write-Warning "FILE_STORAGE.md not found; lifecycle/retention policy is undocumented."
    exit 1
}

$text = Get-Content $docs -Raw
if ($text -notmatch '(?i)lifecycle|retention') {
    Write-Warning "Storage lifecycle/retention section not detected."
    exit 1
}

Write-Host "Storage lifecycle documentation detected."
