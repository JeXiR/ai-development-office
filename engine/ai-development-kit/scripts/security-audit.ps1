param([Parameter(Mandatory=$true)][string]$ProjectPath)

$results = @()

function Run-Check($name, $scriptPath, $args) {
    Write-Host ""
    Write-Host "== $name =="
    & $scriptPath @args
    $code = $LASTEXITCODE
    $script:results += [pscustomobject]@{ check=$name; exit_code=$code }
}

Run-Check "Secret scan" "$PSScriptRoot\scan-secrets.ps1" @("-ProjectPath",$ProjectPath)
Run-Check "Dependency audit" "$PSScriptRoot\audit-dependencies.ps1" @("-ProjectPath",$ProjectPath)
Run-Check "Environment audit" "$PSScriptRoot\audit-environment.ps1" @("-ProjectPath",$ProjectPath)
Run-Check "Security config audit" "$PSScriptRoot\audit-security-config.ps1" @("-ProjectPath",$ProjectPath)
Run-Check "Route audit" "$PSScriptRoot\audit-routes.ps1" @("-ProjectPath",$ProjectPath)

Write-Host ""
Write-Host "== Security Audit Summary =="
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.exit_code -ne 0 })
if ($failed.Count -gt 0) { exit 1 }

Write-Host "Security audit pipeline completed successfully."
