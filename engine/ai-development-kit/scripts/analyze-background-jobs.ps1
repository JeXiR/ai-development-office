param([Parameter(Mandatory=$true)][string]$ProjectPath)

$signals = [ordered]@{
    laravel_jobs = @()
    queue_configs = @()
    scheduler_files = @()
    js_workers = @()
}

$jobsDir = Join-Path $ProjectPath "app\Jobs"
if (Test-Path $jobsDir) {
    $signals.laravel_jobs = @(Get-ChildItem $jobsDir -File -Recurse -Filter "*.php" |
        ForEach-Object { $_.FullName.Substring($ProjectPath.Length).TrimStart('\') })
}

foreach ($rel in @("config\queue.php","routes\console.php","app\Console\Kernel.php")) {
    if (Test-Path (Join-Path $ProjectPath $rel)) {
        if ($rel -match "queue") { $signals.queue_configs += $rel }
        else { $signals.scheduler_files += $rel }
    }
}

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\' -and
        $_.Extension -in @(".ts",".js")
    } | ForEach-Object {
        try {
            $t = Get-Content $_.FullName -Raw
            if ($t -match '(?i)bullmq|bull\b|agenda|worker|queue') {
                $signals.js_workers += $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
            }
        } catch {}
    }

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

@{
    generated_at = (Get-Date).ToString("o")
    signals = $signals
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $aiDir "background-jobs-profile.json") -Encoding UTF8

Write-Host "Laravel jobs: $($signals.laravel_jobs.Count)"
Write-Host "JS/TS queue-worker signals: $($signals.js_workers.Count)"
Write-Host "Scheduler files: $($signals.scheduler_files.Count)"
