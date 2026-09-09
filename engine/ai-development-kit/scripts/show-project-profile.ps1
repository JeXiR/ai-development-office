param([Parameter(Mandatory=$true)][string]$ProjectPath)

$path = Join-Path $ProjectPath ".ai-kit\project-profile.json"
if (-not (Test-Path $path)) {
    throw "No profile found. Run analyze-project.ps1 or bootstrap-project.ps1 first."
}
Get-Content $path -Raw
