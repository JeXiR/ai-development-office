param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$KitRoot = Split-Path -Parent $PSScriptRoot
$profilePath = Join-Path $ProjectPath ".ai-kit\project-profile.json"
if (-not (Test-Path $profilePath)) {
    & "$PSScriptRoot\analyze-project.ps1" -ProjectPath $ProjectPath
}

$profile = Get-Content $profilePath -Raw | ConvertFrom-Json
$det = $profile.detected

$skills = New-Object System.Collections.Generic.HashSet[string]

$core = @(
    "find-skill","project-context","project-analyzer","architecture",
    "coding-standards","debugging","security","testing","code-review","git",
    "license-source-check","selective-skill-installer","project-sync","workflow-command-router","next-action-resolver","decision-resolver","project-audit","project-state-bootstrap","project-discovery-engine","docs-discovery","docs-normalizer","roadmap-engine","state-reconstruction","docs-consistency-auditor","response-language"
)
$core | ForEach-Object { [void]$skills.Add($_) }

function Has-Key($obj, $name) {
    return $null -ne $obj.PSObject.Properties[$name]
}

if (Has-Key $det "laravel") {
    @("php","laravel","eloquent","migrations","authentication","authorization") |
        ForEach-Object { [void]$skills.Add($_) }

    # Laravel projects often expose APIs, but do not force laravel-api without evidence.
    $routesApi = Join-Path $ProjectPath "routes\api.php"
    if (Test-Path $routesApi) { [void]$skills.Add("laravel-api") }

    foreach ($pair in @(
        @{file="config\queue.php"; skill="queues"},
        @{file="config\cache.php"; skill="caching"}
    )) {
        if (Test-Path (Join-Path $ProjectPath $pair.file)) { [void]$skills.Add($pair.skill) }
    }
}

if ((Has-Key $det "react") -or (Has-Key $det "next")) {
    [void]$skills.Add("react")
    @("responsive-ui","accessibility","frontend-performance","design-system","component-reuse","ui-architecture") |
        ForEach-Object { [void]$skills.Add($_) }
}
if (Has-Key $det "next") { [void]$skills.Add("nextjs") }
if (Has-Key $det "typescript") { [void]$skills.Add("typescript") }
if (Has-Key $det "blade") {
    [void]$skills.Add("blade")
    @("responsive-ui","accessibility","design-system","component-reuse") |
        ForEach-Object { [void]$skills.Add($_) }
}
if (Has-Key $det "tailwindcss") { [void]$skills.Add("tailwind") }
if ((Has-Key $det "motion") -or (Has-Key $det "framer-motion")) {
    @("animation","animation-decision") | ForEach-Object { [void]$skills.Add($_) }
}
if (Has-Key $det "gsap") {
    @("animation","animation-decision","animation-source-finder") |
        ForEach-Object { [void]$skills.Add($_) }
}
if (Has-Key $det "three") {
    @("animation-source-finder","external-library-evaluator") |
        ForEach-Object { [void]$skills.Add($_) }
}

if (Has-Key $det "prisma") {
    [void]$skills.Add("prisma")
    [void]$skills.Add("migrations")
}
if (Has-Key $det "docker") {
    @("docker","deployment") | ForEach-Object { [void]$skills.Add($_) }
}
if (Has-Key $det "docker_compose") { [void]$skills.Add("docker-compose") }

if ((Has-Key $det "expo") -or (Has-Key $det "react-native")) {
    @(
        "react-native","mobile-workflow","mobile-ui","navigation","mobile-storage",
        "mobile-auth","mobile-api","mobile-security","mobile-testing",
        "mobile-build-release","mobile-qa"
    ) | ForEach-Object { [void]$skills.Add($_) }
}
if (Has-Key $det "expo") { [void]$skills.Add("expo") }
if (Has-Key $det "eas") {
    @("mobile-build-release","app-store-release") | ForEach-Object { [void]$skills.Add($_) }
}

# Docs-driven cloud detection
$docsText = ""
$docsPath = Join-Path $ProjectPath "docs"
if (Test-Path $docsPath) {
    Get-ChildItem $docsPath -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        try { $docsText += "`n" + (Get-Content $_.FullName -Raw -ErrorAction Stop) } catch {}
    }
}

if ($docsText -match "(?i)\bAWS\b|Amazon Web Services") { [void]$skills.Add("aws-foundations") }
if ($docsText -match "(?i)\bS3\b|Simple Storage Service") { [void]$skills.Add("aws-s3") }
if ($docsText -match "(?i)\bRDS\b|Aurora") { [void]$skills.Add("aws-rds") }
if ($docsText -match "(?i)\bECS\b|Fargate") { [void]$skills.Add("aws-ecs") }
if ($docsText -match "(?i)\bEC2\b") { [void]$skills.Add("aws-ec2") }
if ($docsText -match "(?i)\bLambda\b") { [void]$skills.Add("aws-lambda") }
if ($docsText -match "(?i)\bCloudFront\b") { [void]$skills.Add("aws-cloudfront") }
if ($docsText -match "(?i)Route\s*53") { [void]$skills.Add("aws-route53") }

# External source intelligence if project policy/reference docs indicate it.
$externalPolicy = Join-Path $ProjectPath "docs\frontend\EXTERNAL_SOURCES.md"
if (Test-Path $externalPolicy) {
    @(
        "component-source-finder","animation-source-finder","external-library-evaluator",
        "source-router","source-composer","template-source-selector"
    ) | ForEach-Object { [void]$skills.Add($_) }
}

# Explicit overrides
$overridePath = Join-Path $ProjectPath ".ai-kit\skill-overrides.json"
if (Test-Path $overridePath) {
    $ov = Get-Content $overridePath -Raw | ConvertFrom-Json
    if ($ov.include) { $ov.include | ForEach-Object { [void]$skills.Add($_) } }
    if ($ov.pin) { $ov.pin | ForEach-Object { [void]$skills.Add($_) } }

    $protected = New-Object System.Collections.Generic.HashSet[string]
    $core | ForEach-Object { [void]$protected.Add($_) }

    if ($ov.exclude) {
        foreach ($s in $ov.exclude) {
            if (-not $protected.Contains($s)) { [void]$skills.Remove($s) }
        }
    }
}

# Core workflow dependencies added directly to the resolved skill set.
@("risk-priority-engine","roadmap-reconciler","durable-handoff-v2","office-telemetry") |
    ForEach-Object { [void]$skills.Add($_) }

$skills | Sort-Object
