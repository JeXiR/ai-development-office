param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$errors = @()
$fixtures = Join-Path $KitRoot "tests\fixtures"

# B01
if ((Get-ChildItem (Join-Path $fixtures "empty-project") -Recurse -File | Measure-Object).Count -lt 1) {
  $errors += "B01 empty-project fixture invalid"
}

# B02
if (-not (Test-Path (Join-Path $fixtures "docs-only-project\docs\ROADMAP.md"))) {
  $errors += "B02 roadmap fixture missing"
}

# B03: intentionally tiny/template-like PROGRESS should be reconstructable by policy
$p = Join-Path $fixtures "stale-progress-project\PROGRESS.md"
if (-not (Test-Path $p) -or (Get-Content $p -Raw).Length -gt 250) {
  $errors += "B03 stale progress fixture invalid"
}

# B04
$a = Get-Content (Join-Path $fixtures "conflicting-docs-project\docs\ARCHITECTURE.md") -Raw
$o = Get-Content (Join-Path $fixtures "conflicting-docs-project\docs\OLD_PLAN.md") -Raw
if ($a -notmatch "PostgreSQL" -or $o -notmatch "MySQL") {
  $errors += "B04 conflict fixture invalid"
}

# B05
try {
  $h = Get-Content (Join-Path $fixtures "interrupted-handoff-project\.ai-kit\current-task.json") -Raw | ConvertFrom-Json
  if ($h.next_step -ne "inspect tenant middleware") { $errors += "B05 handoff next_step invalid" }
} catch { $errors += "B05 handoff JSON invalid" }

# B06
$v = Get-Content (Join-Path $fixtures "validation-failed-project\PROGRESS.md") -Raw
if ($v -notmatch "Tests: FAIL" -or $v -match "VERIFIED_DONE") {
  $errors += "B06 validation fixture invalid"
}

if ($errors.Count -gt 0) {
  Write-Host "BEHAVIOR CONTRACT TESTS FAILED"
  $errors | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Behavior contract fixture tests passed."
Write-Host "Contracts: B01 B02 B03 B04 B05 B06"
exit 0
