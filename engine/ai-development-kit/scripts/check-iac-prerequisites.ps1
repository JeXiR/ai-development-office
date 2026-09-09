$terraform = Get-Command terraform -ErrorAction SilentlyContinue
$tofu = Get-Command tofu -ErrorAction SilentlyContinue

if (-not $terraform -and -not $tofu) {
    Write-Error "Terraform or OpenTofu not found."
    exit 1
}

if ($terraform) { Write-Host "Terraform detected: $($terraform.Source)" }
if ($tofu) { Write-Host "OpenTofu detected: $($tofu.Source)" }
