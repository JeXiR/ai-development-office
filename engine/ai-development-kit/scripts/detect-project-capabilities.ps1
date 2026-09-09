param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
$rules = Get-Content (Join-Path $KitRoot "shared\capabilities\detectors.json") -Raw | ConvertFrom-Json

$text = ""
$docs = Join-Path $ProjectPath "docs"
if (Test-Path $docs) {
  Get-ChildItem $docs -Recurse -File -Include *.md,*.txt,*.json,*.yml,*.yaml |
    ForEach-Object { $text += "`n" + (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) }
}
foreach ($file in @("README.md","PROJECT_STATE.md","PROGRESS.md","package.json","composer.json")) {
  $path = Join-Path $ProjectPath $file
  if (Test-Path $path) { $text += "`n" + (Get-Content $path -Raw -ErrorAction SilentlyContinue) }
}

$found = New-Object System.Collections.Generic.HashSet[string]
foreach ($rule in $rules.detectors) {
  foreach ($pattern in $rule.patterns) {
    if ($text -match $pattern) {
      [void]$found.Add([string]$rule.capability)
      break
    }
  }
}

$ai = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $ai | Out-Null

$report = [ordered]@{
  schema_version = "1.0"
  project = (Split-Path $ProjectPath -Leaf)
  capabilities = @($found | Sort-Object)
  evidence_source = "docs + root manifests"
}
$report | ConvertTo-Json -Depth 10 |
  Set-Content (Join-Path $ai "project-requirements.json") -Encoding UTF8

Write-Host "Detected capabilities: $($found.Count)"
@($found | Sort-Object) | ForEach-Object { Write-Host " - $_" }
