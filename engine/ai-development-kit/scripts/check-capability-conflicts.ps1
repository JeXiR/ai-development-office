param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [Parameter(Mandatory=$true)][string]$Capability
)

$issues = @()

function Add-Issue($severity, $reason, $resolution) {
    $script:issues += [pscustomobject]@{
        severity = $severity
        reason = $reason
        resolution = $resolution
    }
}

$packagePath = Join-Path $ProjectPath "package.json"
$composerPath = Join-Path $ProjectPath "composer.json"

$pkg = $null
$composer = $null

if (Test-Path $packagePath) { $pkg = Get-Content $packagePath -Raw | ConvertFrom-Json }
if (Test-Path $composerPath) { $composer = Get-Content $composerPath -Raw | ConvertFrom-Json }

$deps = @{}
if ($pkg) {
    if ($pkg.dependencies) { $pkg.dependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
    if ($pkg.devDependencies) { $pkg.devDependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
}

switch ($Capability) {
    "motion" {
        if ($deps.ContainsKey("framer-motion")) {
            Add-Issue "WARNING" "framer-motion is already installed." "Prefer the existing animation stack or plan an explicit migration."
        }
        if ($deps.ContainsKey("gsap")) {
            Add-Issue "INFO" "GSAP is already installed." "Use Motion only if it serves a distinct interaction need."
        }
    }

    "shadcn-ui" {
        foreach ($candidate in @("@mui/material","antd","@chakra-ui/react")) {
            if ($deps.ContainsKey($candidate)) {
                Add-Issue "WARNING" "$candidate is already installed." "Do not introduce a second UI system without an explicit coexistence/migration plan."
            }
        }
    }

    "prisma" {
        foreach ($candidate in @("typeorm","sequelize","drizzle-orm")) {
            if ($deps.ContainsKey($candidate)) {
                Add-Issue "BLOCKER" "$candidate is already installed as an ORM." "Decide whether Prisma is replacing or coexisting before installation."
            }
        }
    }

    "laravel-sanctum" {
        if ($composer) {
            $all = @{}
            if ($composer.require) { $composer.require.psobject.Properties | ForEach-Object { $all[$_.Name] = $_.Value } }
            foreach ($candidate in @("laravel/passport","tymon/jwt-auth")) {
                if ($all.ContainsKey($candidate)) {
                    Add-Issue "BLOCKER" "$candidate is already present." "Review the current authentication architecture before adding Sanctum."
                }
            }
        }
    }

    "redis" {
        if ($deps.ContainsKey("ioredis") -and $deps.ContainsKey("redis")) {
            Add-Issue "WARNING" "Both ioredis and redis clients are installed." "Standardize on one Redis client unless both are intentionally required."
        }
    }

    "expo-secure-store" {
        foreach ($candidate in @("react-native-keychain","@react-native-async-storage/async-storage")) {
            if ($deps.ContainsKey($candidate)) {
                $sev = if ($candidate -eq "react-native-keychain") { "WARNING" } else { "INFO" }
                Add-Issue $sev "$candidate is already present." "Review existing credential-storage usage before adding another storage mechanism."
            }
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host "No known capability conflicts detected."
    exit 0
}

$blockers = @($issues | Where-Object { $_.severity -eq "BLOCKER" })

$issues | Format-Table severity, reason, resolution -AutoSize

if ($blockers.Count -gt 0) {
    exit 2
}

exit 0
