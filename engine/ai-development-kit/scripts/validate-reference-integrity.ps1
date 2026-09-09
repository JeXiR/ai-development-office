param([string]$KitRoot = (Split-Path -Parent $PSScriptRoot))

$errors = @()

$manifestPath = Join-Path $KitRoot "kit.manifest.json"
if (-not (Test-Path $manifestPath)) {
    $errors += "kit.manifest.json missing"
}
else {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

    # Only manifest fields that are intended to contain kit-local file references.
    $pathKeys = @(
        "doctor",
        "self_test",
        "skill_registry_validation",
        "reference_validation",
        "adapter_parity",
        "json_validation",
        "finalization_doc",
        "updater",
        "script",
        "workflow",
        "guide",
        "router",
        "decision_resolver",
        "state_helper",
        "initializer",
        "validator",
        "planner",
        "safety_check",
        "template",
        "analyzer",
        "generator",
        "build_validation",
        "combined",
        "budget",
        "prepare",
        "readiness",
        "doc_sync",
        "project_state",
        "profile",
        "lifecycle_check",
        "tenant_check",
        "upload_security",
        "reliability_check",
        "scheduler_check",
        "docs_discovery",
        "state_freshness",
        "architecture",
        "event_schema",
        "state_schema",
        "state_contract",
        "command_contracts",
        "audit_coverage_contract",
        "durable_handoff_schema",
        "behavior_tests"
    )

    function Looks-LikeKitPath {
        param([string]$Value)

        if ([string]::IsNullOrWhiteSpace($Value)) { return $false }

        # URLs, prose, identifiers and command names are not kit paths.
        if ($Value -match '^https?://') { return $false }
        if ($Value -match '^\$') { return $false }
        if ($Value -match '\s') { return $false }

        # A kit-local path should contain a directory separator OR a recognized file extension.
        if ($Value -match '[/\\]') { return $true }
        if ($Value -match '\.(ps1|md|json|yml|yaml|tf|txt)$') { return $true }

        return $false
    }

    function Test-ManifestNode {
        param(
            [Parameter(Mandatory=$true)]$Node,
            [string]$KeyName = ""
        )

        if ($null -eq $Node) { return }

        if ($Node -is [string]) {
            if (($pathKeys -contains $KeyName) -and (Looks-LikeKitPath $Node)) {

                # These are generated in target projects, not required to exist in the kit root.
                if ($Node -match '^(\.ai-kit[/\\]|docs[/\\]|PROGRESS\.md$|PROJECT_STATE\.md$|src[/\\]|infrastructure[/\\])') {
                    return
                }

                $candidate = Join-Path $KitRoot $Node
                if (-not (Test-Path $candidate)) {
                    $script:errors += "Manifest path missing: $Node"
                }
            }
            return
        }

        if ($Node -is [System.Collections.IEnumerable] -and -not ($Node -is [pscustomobject])) {
            foreach ($item in $Node) {
                Test-ManifestNode -Node $item -KeyName $KeyName
            }
            return
        }

        if ($Node -is [pscustomobject]) {
            foreach ($property in $Node.PSObject.Properties) {
                Test-ManifestNode -Node $property.Value -KeyName $property.Name
            }
        }
    }

    Test-ManifestNode -Node $manifest
}

foreach ($path in @(
    "shared\presets\registry.json",
    "shared\capabilities\registry.json",
    "shared\external-sources\registry.json",
    "shared\capabilities\dependency-graph.json"
)) {
    if (-not (Test-Path (Join-Path $KitRoot $path))) {
        $errors += "Missing core registry: $path"
    }
}

if ($errors.Count -gt 0) {
    $errors | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Reference integrity baseline passed."
exit 0
