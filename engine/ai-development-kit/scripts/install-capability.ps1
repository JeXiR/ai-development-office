param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Capability
)

$KitRoot = Split-Path -Parent $PSScriptRoot

& "$PSScriptRoot\check-capability-conflicts.ps1" -ProjectPath $ProjectPath -Capability $Capability
if ($LASTEXITCODE -eq 2) {
    throw "Capability installation blocked by detected conflicts."
}

$registry = Get-Content "$KitRoot\shared\capabilities\registry.json" -Raw | ConvertFrom-Json
$cap = $registry.capabilities | Where-Object { $_.id -eq $Capability } | Select-Object -First 1
if (-not $cap) { throw "Unknown capability: $Capability" }

Push-Location $ProjectPath
try {
    switch ($Capability) {
        "prisma" {
            npm install @prisma/client
            if ($LASTEXITCODE -ne 0) { throw "Failed installing @prisma/client" }
            npm install -D prisma
            if ($LASTEXITCODE -ne 0) { throw "Failed installing prisma" }
            if (-not (Test-Path "prisma\schema.prisma")) {
                npx prisma init
                if ($LASTEXITCODE -ne 0) { throw "prisma init failed" }
            }
        }

        "shadcn-ui" {
            npx shadcn@latest init
            if ($LASTEXITCODE -ne 0) { throw "shadcn init failed" }
        }

        "motion" {
            npm install motion
            if ($LASTEXITCODE -ne 0) { throw "Motion install failed" }
        }

        "laravel-sanctum" {
            composer require laravel/sanctum
            if ($LASTEXITCODE -ne 0) { throw "Sanctum install failed" }
            php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
        }

        "laravel-s3" {
            composer require league/flysystem-aws-s3-v3
            if ($LASTEXITCODE -ne 0) { throw "S3 adapter install failed" }

            $envExample = ".env.example"
            if (Test-Path $envExample) {
                $content = Get-Content $envExample -Raw
                $keys = @(
                    "AWS_ACCESS_KEY_ID=",
                    "AWS_SECRET_ACCESS_KEY=",
                    "AWS_DEFAULT_REGION=",
                    "AWS_BUCKET=",
                    "AWS_USE_PATH_STYLE_ENDPOINT=false"
                )
                foreach ($k in $keys) {
                    if ($content -notmatch [regex]::Escape(($k -split '=')[0])) {
                        Add-Content $envExample $k
                    }
                }
            }
        }

        "laravel-queue-database" {
            php artisan queue:table
            if ($LASTEXITCODE -ne 0) { throw "queue:table failed" }
            Write-Host "Migration created. Review before running migrate."
        }

        "laravel-cache-database" {
            if (Get-Command php -ErrorAction SilentlyContinue) {
                php artisan cache:table
                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "cache:table command may not be available in this Laravel version/project."
                }
            }
            Write-Host "Set CACHE_STORE=database only after reviewing migration/config."
        }

        "redis" {
            if (Test-Path "composer.json") {
                composer require predis/predis
                if ($LASTEXITCODE -ne 0) { throw "Predis install failed" }
                Write-Host "Redis client installed for Laravel/PHP project."
            }
            elseif (Test-Path "package.json") {
                npm install redis
                if ($LASTEXITCODE -ne 0) { throw "redis package install failed" }
            }
            else {
                throw "Unable to determine package ecosystem for Redis capability."
            }
        }

        "expo-secure-store" {
            npx expo install expo-secure-store
            if ($LASTEXITCODE -ne 0) { throw "expo-secure-store install failed" }
        }

        "playwright" {
            npm install -D @playwright/test
            if ($LASTEXITCODE -ne 0) { throw "Playwright install failed" }
            npx playwright install --with-deps chromium
        }

        "axe-playwright" {
            npm install -D @axe-core/playwright
            if ($LASTEXITCODE -ne 0) { throw "axe Playwright install failed" }
        }

        "image-processing-node" {
            npm install sharp
            if ($LASTEXITCODE -ne 0) { throw "sharp install failed" }
        }

        "aws-s3-sdk-node" {
            npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
            if ($LASTEXITCODE -ne 0) { throw "AWS S3 SDK install failed" }
        }

        "openapi-typescript" {
            npm install -D openapi-typescript
            if ($LASTEXITCODE -ne 0) { throw "openapi-typescript install failed" }
        }

        "expo-notifications" {
            npx expo install expo-notifications
            if ($LASTEXITCODE -ne 0) { throw "expo-notifications install failed" }
        }

        default {
            throw "Capability installer not implemented: $Capability"
        }
    }
}
finally {
    Pop-Location
}

# Persist capability
$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null
$capPath = Join-Path $aiDir "installed-capabilities.json"

$current = @()
if (Test-Path $capPath) {
    $obj = Get-Content $capPath -Raw | ConvertFrom-Json
    if ($obj.capabilities) { $current = @($obj.capabilities) }
}

$current = @($current + $Capability | Sort-Object -Unique)

@{
    generated_at = (Get-Date).ToString("o")
    capabilities = $current
} | ConvertTo-Json -Depth 5 | Set-Content $capPath -Encoding UTF8

# Add capability skills as explicit includes.
$overridePath = Join-Path $aiDir "skill-overrides.json"
if (Test-Path $overridePath) {
    $ov = Get-Content $overridePath -Raw | ConvertFrom-Json
} else {
    $ov = [pscustomobject]@{ include=@(); exclude=@(); pin=@() }
}

$includes = @($ov.include)
foreach ($s in $cap.skills) {
    if ($s -notin $includes) { $includes += $s }
}

@{
    include = @($includes | Sort-Object -Unique)
    exclude = @($ov.exclude)
    pin = @($ov.pin)
} | ConvertTo-Json -Depth 5 | Set-Content $overridePath -Encoding UTF8

& "$PSScriptRoot\sync-project.ps1" -ProjectPath $ProjectPath

Write-Host "Capability installed: $Capability"
