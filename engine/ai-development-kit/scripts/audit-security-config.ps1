param([Parameter(Mandatory=$true)][string]$ProjectPath)

$findings = @()

function Add-Finding($severity, $message) {
    $script:findings += [pscustomobject]@{ severity=$severity; message=$message }
}

$envExample = Join-Path $ProjectPath ".env.example"
if (Test-Path $envExample) {
    $text = Get-Content $envExample -Raw
    if ($text -match '(?im)^APP_DEBUG\s*=\s*true') {
        Add-Finding "MEDIUM" ".env.example has APP_DEBUG=true."
    }
}

# Laravel-specific lightweight checks
if (Test-Path (Join-Path $ProjectPath "artisan")) {
    $cors = Join-Path $ProjectPath "config\cors.php"
    if (Test-Path $cors) {
        $text = Get-Content $cors -Raw
        if ($text -match "allowed_origins'.*'\*'") {
            Add-Finding "MEDIUM" "Laravel CORS appears to allow wildcard origins."
        }
    }

    $routes = @(
        (Join-Path $ProjectPath "routes\web.php"),
        (Join-Path $ProjectPath "routes\api.php")
    )
    foreach ($r in $routes) {
        if (Test-Path $r) {
            $text = Get-Content $r -Raw
            if ($text -match '(?i)(phpinfo|debug|telescope|horizon|test-route|dev-route)') {
                Add-Finding "MEDIUM" "Potential development/debug route reference in $r"
            }
        }
    }
}

# Next.js checks
$nextConfig = Get-ChildItem $ProjectPath -File -Filter "next.config.*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nextConfig) {
    $text = Get-Content $nextConfig.FullName -Raw
    if ($text -match '(?i)dangerouslyAllowSVG|dangerously') {
        Add-Finding "LOW" "Potentially dangerous Next.js config option detected; review manually."
    }
}

if ($findings.Count -eq 0) {
    Write-Host "No obvious risky security configuration patterns detected."
    exit 0
}

$findings | Format-Table -AutoSize
exit 1
