param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$skillRoot = Join-Path $KitRoot "shared\skills"
$aiDir = Join-Path $ProjectPath ".ai-kit"
$cursorRoot = Join-Path $ProjectPath ".cursor\skills"
$claudeRoot = Join-Path $ProjectPath ".claude\skills"

New-Item -ItemType Directory -Force -Path $aiDir,$cursorRoot,$claudeRoot | Out-Null

$desired = @(& "$PSScriptRoot\resolve-skills.ps1" -ProjectPath $ProjectPath)

$catalog = @{}
Get-ChildItem $skillRoot -Filter "SKILL.md" -Recurse | ForEach-Object {
    $folder = $_.Directory
    $content = Get-Content $_.FullName -Raw
    if ($content -match "(?m)^name:\s*([^\r\n]+)") {
        $name = $matches[1].Trim()
        $catalog[$name] = $folder.FullName
    }
}

$installed = @()

foreach ($name in $desired) {
    if (-not $catalog.ContainsKey($name)) {
        Write-Warning "Skill not found in master catalog: $name"
        continue
    }

    foreach ($targetRoot in @($cursorRoot,$claudeRoot)) {
        $dest = Join-Path $targetRoot $name
        if (Test-Path $dest) {
            $marker = Join-Path $dest ".ai-kit-managed"
            if (Test-Path $marker) {
                Remove-Item $dest -Recurse -Force
            } else {
                Write-Warning "Preserving unmanaged skill folder: $dest"
                continue
            }
        }

        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        Copy-Item (Join-Path $catalog[$name] "*") $dest -Recurse -Force
        Set-Content (Join-Path $dest ".ai-kit-managed") "managed_by=ai-development-kit" -Encoding UTF8
    }

    $installed += $name
}

$manifest = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    mode = "selective"
    skills = @($installed | Sort-Object -Unique)
}

$manifest | ConvertTo-Json -Depth 5 |
    Set-Content (Join-Path $aiDir "installed-skills.json") -Encoding UTF8

Write-Host "Installed $($manifest.skills.Count) managed skills for Cursor and Claude."
