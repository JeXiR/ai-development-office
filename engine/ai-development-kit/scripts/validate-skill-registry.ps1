param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$registryPath = Join-Path $KitRoot "shared\skill-registry.json"
if (-not (Test-Path $registryPath)) { throw "Missing skill registry." }

$registry = Get-Content $registryPath -Raw | ConvertFrom-Json
$errors = @()
$seen = @{}

Get-ChildItem (Join-Path $KitRoot "shared\skills") -Filter "SKILL.md" -Recurse | ForEach-Object {
    $text = Get-Content $_.FullName -Raw
    if ($text -match '(?m)^name:\s*([^\r\n]+)') {
        $name = $matches[1].Trim()
        if ($seen.ContainsKey($name)) {
            $errors += "Duplicate SKILL.md name: $name"
        } else {
            $seen[$name] = $_.FullName
        }
    } else {
        $errors += "Missing skill name frontmatter: $($_.FullName)"
    }
}

$registered = @()
$registry.psobject.Properties | ForEach-Object {
    foreach ($name in $_.Value) {
        if ($name -in $registered) { $errors += "Duplicate registry entry: $name" }
        $registered += $name
        if (-not $seen.ContainsKey($name)) {
            $errors += "Registry references missing skill: $name"
        }
    }
}

foreach ($name in $seen.Keys) {
    if ($name -notin $registered) {
        $errors += "Orphan skill not registered: $name"
    }
}

if ($errors.Count -gt 0) {
    $errors | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Skill registry valid. Skills: $($seen.Keys.Count)"
