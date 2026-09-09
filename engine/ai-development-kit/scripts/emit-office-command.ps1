param(
    [Parameter(Mandatory=$false)

if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
    $ProjectPath = (Get-Location).Path
}

][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Command,
    [ValidateSet("start","done","error")][string]$Phase = "start",
    [string]$Message = ""
)

$emitter = Join-Path $PSScriptRoot "emit-office-event.ps1"

switch ($Phase) {
    "start" {
        & $emitter -ProjectPath $ProjectPath -ActorId "ceo" -Role "CEO" -EventType "command" -Status "planning" -Task $Command -Message $(if ($Message) { $Message } else { "Command started: $Command" })
    }
    "done" {
        & $emitter -ProjectPath $ProjectPath -ActorId "ceo" -Role "CEO" -EventType "task_completed" -Status "done" -Task $Command -Message $(if ($Message) { $Message } else { "Command completed: $Command" })
    }
    "error" {
        & $emitter -ProjectPath $ProjectPath -ActorId "ceo" -Role "CEO" -EventType "error" -Status "error" -Task $Command -Message $(if ($Message) { $Message } else { "Command failed: $Command" })
    }
}
