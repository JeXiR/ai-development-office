param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][ValidateSet("template","legacy","figma","screenshot")][string]$Type,
    [Parameter(Mandatory=$true)][string]$Name
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$DocsRef = Join-Path $ProjectPath "docs\references"
New-Item -ItemType Directory -Force -Path $DocsRef | Out-Null

$templateMap = @{
    "template"   = "PURCHASED_TEMPLATE_TEMPLATE.md"
    "legacy"     = "LEGACY_PROJECT_TEMPLATE.md"
    "figma"      = "FIGMA_TEMPLATE.md"
    "screenshot" = "SCREENSHOT_TEMPLATE.md"
}

$source = Join-Path $KitRoot ("docs-template\references\" + $templateMap[$Type])
$target = Join-Path $DocsRef ($Name + ".md")

if (Test-Path $target) {
    throw "Reference already exists: $target"
}

Copy-Item $source $target
Write-Host "Reference registered: $target"
