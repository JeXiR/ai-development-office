param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Title,
    [string]$Milestone = "",
    [ValidateSet("todo","in_progress","blocked","failed","done")][string]$Status = "in_progress",
    [string]$NextAction = ""
)

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

$state = [ordered]@{
    updated_at = (Get-Date).ToString("o")
    status = $Status
    title = $Title
    milestone = $Milestone
    feature_doc = $null
    changed_areas = @()
    validation = @{}
    blockers = @()
    next_action = $NextAction
}

$state | ConvertTo-Json -Depth 10 |
    Set-Content (Join-Path $aiDir "current-task.json") -Encoding UTF8

Write-Host "Current task updated: $Title [$Status]"
