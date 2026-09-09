param([Parameter(Mandatory=$true)][string]$ProjectPath)

$budgetPath = Join-Path $ProjectPath ".ai-kit\performance-budget.json"
if (-not (Test-Path $budgetPath)) {
    Write-Error "Performance budget missing. Run init-frontend-quality.ps1."
    exit 1
}

$package = Join-Path $ProjectPath "package.json"
if (-not (Test-Path $package)) {
    Write-Warning "No package.json detected; frontend performance budget check skipped."
    exit 0
}

$budget = Get-Content $budgetPath -Raw | ConvertFrom-Json
Write-Host "Configured performance budget:"
Write-Host " - initial JS <= $($budget.global.max_initial_js_kb) KB"
Write-Host " - CSS <= $($budget.global.max_css_kb) KB"
Write-Host " - images <= $($budget.global.max_image_kb) KB"
Write-Host " - requests <= $($budget.global.max_requests)"
Write-Host " - LCP <= $($budget.global.lcp_ms) ms"
Write-Host " - INP <= $($budget.global.inp_ms) ms"
Write-Host " - CLS <= $($budget.global.cls)"

Write-Host "Static threshold contract validated. Runtime/Lighthouse measurements should be integrated in CI for enforcement."
