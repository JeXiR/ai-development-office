param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [ValidateSet("existing","new")][string]$Mode = "existing"
)

$KitRoot = Split-Path -Parent $PSScriptRoot

if ($Mode -eq "existing") {
    & "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
    & "$PSScriptRoot\install-project.ps1" -ProjectPath $ProjectPath
    Write-Host "Existing project bootstrapped."
    exit
}

if (-not (Test-Path $ProjectPath)) {
    New-Item -ItemType Directory -Force -Path $ProjectPath | Out-Null
}

Write-Host ""
Write-Host "AI Development Kit - New Project Wizard"
Write-Host ""

$backend = Read-Host "Backend (laravel/nextjs/none)"
$frontend = Read-Host "Frontend (blade/react/nextjs/none)"
$db = Read-Host "Database (mysql/postgres/none)"
$container = Read-Host "Docker? (yes/no)"
$cloud = Read-Host "Cloud target (aws/vps/none)"
$mobile = Read-Host "Mobile (expo/react-native/none)"

$profile = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    mode = "new"
    backend = $backend
    frontend = $frontend
    database = $db
    docker = ($container -eq "yes")
    cloud = $cloud
    mobile = $mobile
}

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null
$profile | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $aiDir "project-profile.json") -Encoding UTF8

& "$PSScriptRoot\install-project.ps1" -ProjectPath $ProjectPath

Write-Host ""
Write-Host "Bootstrap profile created."
Write-Host "Next: choose/create the application starter, then run analyze-project.ps1."

& "$PSScriptRoot\sync-office-tools.ps1" -ProjectPath $ProjectPath

& "$PSScriptRoot\sync-cursor-instructions.ps1" -ProjectPath $ProjectPath
