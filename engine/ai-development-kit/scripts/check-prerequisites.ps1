param(
    [ValidateSet("laravel","nextjs","expo","all")][string]$Target = "all"
)

$errors = @()

function Test-Cmd($name, $label) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        $script:errors += "$label not found ($name)"
        return $false
    }
    return $true
}

if ($Target -eq "laravel" -or $Target -eq "all") {
    Test-Cmd "php" "PHP" | Out-Null
    Test-Cmd "composer" "Composer" | Out-Null
}

if ($Target -eq "nextjs" -or $Target -eq "expo" -or $Target -eq "all") {
    Test-Cmd "node" "Node.js" | Out-Null
    Test-Cmd "npm" "npm" | Out-Null
}

if ($errors.Count -gt 0) {
    Write-Host "Missing prerequisites:"
    $errors | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Prerequisite check passed for: $Target"
