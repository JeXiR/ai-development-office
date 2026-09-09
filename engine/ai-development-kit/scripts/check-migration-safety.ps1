param(
    [Parameter(Mandatory=$true)][string]$ProjectPath
)

$findings = @()

function Add-Finding($severity, $file, $operation) {
    $script:findings += [pscustomobject]@{
        severity = $severity
        file = $file
        operation = $operation
    }
}

# Laravel migrations
$laravelMigrations = Join-Path $ProjectPath "database\migrations"
if (Test-Path $laravelMigrations) {
    Get-ChildItem $laravelMigrations -Filter "*.php" -File | ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')

        foreach ($x in @(
            @{sev="BLOCKER"; rx='->dropColumn\('; op="drop column"},
            @{sev="BLOCKER"; rx='Schema::drop'; op="drop table"},
            @{sev="HIGH"; rx='->renameColumn\('; op="rename column"},
            @{sev="HIGH"; rx='->change\('; op="column alteration"},
            @{sev="HIGH"; rx='->unique\('; op="unique constraint"},
            @{sev="MEDIUM"; rx='->foreign\('; op="foreign key change"}
        )) {
            if ($text -match $x.rx) { Add-Finding $x.sev $rel $x.op }
        }
    }
}

# Prisma migrations / SQL
$prismaMigrations = Join-Path $ProjectPath "prisma\migrations"
if (Test-Path $prismaMigrations) {
    Get-ChildItem $prismaMigrations -Filter "*.sql" -File -Recurse | ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')

        foreach ($x in @(
            @{sev="BLOCKER"; rx='(?i)DROP\s+TABLE'; op="drop table"},
            @{sev="BLOCKER"; rx='(?i)DROP\s+COLUMN'; op="drop column"},
            @{sev="HIGH"; rx='(?i)ALTER\s+COLUMN|ALTER\s+TABLE'; op="alter table/column"},
            @{sev="HIGH"; rx='(?i)ADD\s+CONSTRAINT.*UNIQUE|CREATE\s+UNIQUE\s+INDEX'; op="unique constraint/index"},
            @{sev="MEDIUM"; rx='(?i)CREATE\s+INDEX'; op="index creation"}
        )) {
            if ($text -match $x.rx) { Add-Finding $x.sev $rel $x.op }
        }
    }
}

if ($findings.Count -eq 0) {
    Write-Host "No obvious high-risk migration patterns detected."
    exit 0
}

$findings | Sort-Object severity,file,operation | Format-Table -AutoSize

$blockers = @($findings | Where-Object { $_.severity -eq "BLOCKER" })
if ($blockers.Count -gt 0) { exit 2 }
exit 0
