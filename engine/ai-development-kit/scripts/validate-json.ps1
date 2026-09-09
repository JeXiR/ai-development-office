param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$errors = @()

Get-ChildItem $KitRoot -Filter "*.json" -File -Recurse | ForEach-Object {
    try {
        Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null
    } catch {
        $errors += "Invalid JSON: $($_.FullName)"
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "All JSON files parsed successfully."
