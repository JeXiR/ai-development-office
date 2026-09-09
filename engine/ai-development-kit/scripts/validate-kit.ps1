$KitRoot = Split-Path -Parent $PSScriptRoot
$errors = @()

Get-ChildItem "$KitRoot\shared\skills" -Directory -Recurse | ForEach-Object {
    $children = Get-ChildItem $_.FullName -File -ErrorAction SilentlyContinue
    if ($children.Count -gt 0 -and -not (Test-Path (Join-Path $_.FullName "SKILL.md"))) {
        # ignore structural/category dirs that may contain non-skill files
    }
}

$skillFiles = Get-ChildItem "$KitRoot\shared\skills" -Filter "SKILL.md" -Recurse
foreach ($skill in $skillFiles) {
    $content = Get-Content $skill.FullName -Raw
    if (-not $content.StartsWith("---")) {
        $errors += "Missing frontmatter: $($skill.FullName)"
    }
    if ($content -notmatch "name:") {
        $errors += "Missing name: $($skill.FullName)"
    }
    if ($content -notmatch "description:") {
        $errors += "Missing description: $($skill.FullName)"
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Validated $($skillFiles.Count) skill files successfully."
