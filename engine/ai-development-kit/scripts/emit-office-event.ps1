param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$ActorId,
    [Parameter(Mandatory=$true)][string]$Role,
    [Parameter(Mandatory=$true)][string]$EventType,
    [Parameter(Mandatory=$true)][string]$Status,
    [string]$Task = "",
    [string]$Message = "",
    [string]$Skill = "",
    [string]$File = "",
    [string]$Severity = "",
    [Nullable[int]]$ProgressPercent = $null,
    [string]$Provider = ""
)

$aiKit = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiKit | Out-Null
$eventsPath = Join-Path $aiKit "events.jsonl"

$event = [ordered]@{
    event_id = [guid]::NewGuid().ToString()
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    project_id = (Split-Path $ProjectPath -Leaf)
    actor = [ordered]@{
        id = $ActorId
        role = $Role
        provider = $(if ($Provider) { $Provider } else { $null })
        skill = $(if ($Skill) { $Skill } else { $null })
    }
    event_type = $EventType
    status = $Status
    task = $(if ($Task) { $Task } else { $null })
    file = $(if ($File) { $File } else { $null })
    message = $(if ($Message) { $Message } else { $null })
    severity = $(if ($Severity) { $Severity } else { $null })
    progress_percent = $ProgressPercent
}

$line = $event | ConvertTo-Json -Compress -Depth 10
Add-Content -Path $eventsPath -Value $line -Encoding UTF8
