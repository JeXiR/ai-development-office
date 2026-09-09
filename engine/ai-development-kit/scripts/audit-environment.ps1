param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$names = New-Object System.Collections.Generic.HashSet[string]
$exampleNames = New-Object System.Collections.Generic.HashSet[string]
$findings = @()

function Add-NameFromEnvFile($path, $target) {
    if (-not (Test-Path $path)) { return }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^[A-Za-z_][A-Za-z0-9_]*=') {
            $name = ($line -split '=',2)[0]
            [void]$target.Add($name)
        }
    }
}

$envExample = Join-Path $ProjectPath ".env.example"
Add-NameFromEnvFile $envExample $exampleNames

# Search source text for common env access patterns without printing values.
$patterns = @(
    'env\(["'']([A-Za-z_][A-Za-z0-9_]*)["'']',
    'process\.env\.([A-Za-z_][A-Za-z0-9_]*)',
    'process\.env\[[''"]([A-Za-z_][A-Za-z0-9_]*)[''"]\]',
    'import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)'
)

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\|\\storage\\|\\build\\|\\dist\\'
    } |
    ForEach-Object {
        try {
            $text = Get-Content $_.FullName -Raw -ErrorAction Stop
            foreach ($pattern in $patterns) {
                [regex]::Matches($text, $pattern) | ForEach-Object {
                    if ($_.Groups.Count -gt 1) {
                        [void]$names.Add($_.Groups[1].Value)
                    }
                }
            }
        } catch {}
    }

foreach ($name in $names) {
    if (-not $exampleNames.Contains($name)) {
        $findings += "Referenced but missing from .env.example: $name"
    }
}

foreach ($name in $exampleNames) {
    if (-not $names.Contains($name)) {
        $findings += "Present in .env.example but not detected in source: $name"
    }
}

# Public/private naming hints
foreach ($name in $names) {
    if ($name -match '^(NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_)' -and
        $name -match '(SECRET|PRIVATE|PASSWORD|TOKEN|KEY)') {
        $findings += "Potential secret-like variable exposed as public: $name"
    }
}

if ($findings.Count -eq 0) {
    Write-Host "Environment audit found no obvious contract issues."
} else {
    Write-Host "Environment audit findings:"
    $findings | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
}
