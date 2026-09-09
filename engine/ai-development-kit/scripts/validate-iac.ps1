param([Parameter(Mandatory=$true)][string]$ProjectPath)

& "$PSScriptRoot\check-iac-prerequisites.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

$dirs = Get-ChildItem (Join-Path $ProjectPath "infrastructure") -Directory -Recurse -ErrorAction SilentlyContinue |
    Where-Object { Test-Path (Join-Path $_.FullName "main.tf") }

if (-not $dirs) {
    Write-Warning "No Terraform/OpenTofu root module detected."
    exit 1
}

$cmd = if (Get-Command tofu -ErrorAction SilentlyContinue) { "tofu" } else { "terraform" }

foreach ($d in $dirs) {
    Push-Location $d.FullName
    try {
        & $cmd fmt -check -recursive
        if ($LASTEXITCODE -ne 0) { exit 1 }

        & $cmd init -backend=false -input=false
        if ($LASTEXITCODE -ne 0) { exit 1 }

        & $cmd validate
        if ($LASTEXITCODE -ne 0) { exit 1 }
    }
    finally { Pop-Location }
}

Write-Host "IaC validation passed."
