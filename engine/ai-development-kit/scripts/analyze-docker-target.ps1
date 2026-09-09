param([Parameter(Mandatory=$true)][string]$ProjectPath)

$profilePath = Join-Path $ProjectPath ".ai-kit\project-profile.json"
if (-not (Test-Path $profilePath)) {
    & "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
}
$profile = Get-Content $profilePath -Raw | ConvertFrom-Json
$det = $profile.detected

$roles = @("web")
if (Test-Path (Join-Path $ProjectPath "app\Jobs")) { $roles += "worker" }
if ((Test-Path (Join-Path $ProjectPath "routes\console.php")) -or
    (Test-Path (Join-Path $ProjectPath "app\Console\Kernel.php"))) {
    $roles += "scheduler"
}

$aiDir = Join-Path $ProjectPath ".ai-kit"
@{
    generated_at = (Get-Date).ToString("o")
    detected = $det
    roles = @($roles | Sort-Object -Unique)
} | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $aiDir "docker-target-profile.json") -Encoding UTF8

Write-Host "Detected roles: $($roles -join ', ')"
