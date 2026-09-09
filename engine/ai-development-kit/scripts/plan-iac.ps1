param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [ValidateSet("dev","staging","prod")][string]$Environment,
    [string]$Root = "infrastructure\aws"
)

& "$PSScriptRoot\check-iac-prerequisites.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

$cmd = if (Get-Command tofu -ErrorAction SilentlyContinue) { "tofu" } else { "terraform" }
$rootPath = Join-Path $ProjectPath $Root
$tfvars = Join-Path $rootPath "environments\$Environment.tfvars"

if (-not (Test-Path $tfvars)) {
    $example = "$tfvars.example"
    if (Test-Path $example) {
        throw "Copy/review $example to $tfvars before planning."
    }
    throw "Environment tfvars not found: $tfvars"
}

Push-Location $rootPath
try {
    & $cmd init -input=false
    if ($LASTEXITCODE -ne 0) { exit 1 }

    $planFile = "plan-$Environment.tfplan"
    & $cmd plan -input=false -var-file=$tfvars -out=$planFile
    if ($LASTEXITCODE -ne 0) { exit 1 }

    & $cmd show -no-color $planFile | Set-Content "plan-$Environment.txt" -Encoding UTF8
}
finally { Pop-Location }

Write-Host "Plan generated for: $Environment"
