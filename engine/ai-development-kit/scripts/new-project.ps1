param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [string]$Template = ""
)

$KitRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path $ProjectPath)) {
    New-Item -ItemType Directory -Force -Path $ProjectPath | Out-Null
}

if ($Template -ne "") {
    $TemplatePath = Join-Path $KitRoot "templates\$Template"
    if (-not (Test-Path $TemplatePath)) {
        throw "Template not found: $Template"
    }
    Copy-Item "$TemplatePath\*" $ProjectPath -Recurse -Force
}

& "$PSScriptRoot\install-project.ps1" -ProjectPath $ProjectPath

Write-Host "New AI-ready project initialized at $ProjectPath"
