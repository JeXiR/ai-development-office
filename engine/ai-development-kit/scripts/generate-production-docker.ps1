param([Parameter(Mandatory=$true)][string]$ProjectPath)

$KitRoot = Split-Path -Parent $PSScriptRoot
& "$PSScriptRoot\analyze-docker-target.ps1" -ProjectPath $ProjectPath

$profile = Get-Content (Join-Path $ProjectPath ".ai-kit\docker-target-profile.json") -Raw | ConvertFrom-Json
$det = $profile.detected

function Has-Key($obj, $name) {
    return $null -ne $obj.PSObject.Properties[$name]
}

if (Has-Key $det "laravel") {
    Copy-Item "$KitRoot\templates\docker\laravel\Dockerfile" (Join-Path $ProjectPath "Dockerfile") -Force
}
elseif (Has-Key $det "next") {
    Copy-Item "$KitRoot\templates\docker\nextjs\Dockerfile" (Join-Path $ProjectPath "Dockerfile") -Force
}
else {
    throw "No supported production Docker generator for detected stack."
}

Copy-Item "$KitRoot\templates\docker\compose\compose.prod.yml" (Join-Path $ProjectPath "compose.prod.yml") -Force
Copy-Item "$KitRoot\templates\docker\compose\compose.dev.yml" (Join-Path $ProjectPath "compose.dev.yml") -Force

Write-Host "Generated production Docker baseline."
Write-Host "Review worker/scheduler commands before production use."
