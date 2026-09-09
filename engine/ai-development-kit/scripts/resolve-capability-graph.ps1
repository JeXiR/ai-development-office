param(
  [Parameter(Mandatory=$true)][string[]]$Capabilities,
  [string]$KitRoot = (Split-Path -Parent $PSScriptRoot)
)

$catalog = & "$PSScriptRoot\read-capability-catalog.ps1" -KitRoot $KitRoot
$byId = @{}
$aliases = @{}

foreach ($cap in $catalog) {
  $byId[$cap.id] = $cap
  foreach ($alias in @($cap.aliases)) { $aliases[$alias] = $cap.id }
}

function Canonical([string]$id) {
  if ($byId.ContainsKey($id)) { return $id }
  if ($aliases.ContainsKey($id)) { return $aliases[$id] }
  throw "Unknown capability: $id"
}

$requested = @($Capabilities | ForEach-Object { Canonical $_ } | Select-Object -Unique)
$all = New-Object System.Collections.Generic.HashSet[string]

function Add-WithDeps([string]$id) {
  if ($all.Contains($id)) { return }
  $cap = $byId[$id]
  foreach ($dep in @($cap.depends_on)) {
    Add-WithDeps (Canonical $dep)
  }
  [void]$all.Add($id)
}

foreach ($id in $requested) { Add-WithDeps $id }

# Conflict validation before scaffold.
$conflicts = @()
foreach ($id in @($all)) {
  $cap = $byId[$id]
  foreach ($c in @($cap.conflicts_with)) {
    $canonicalConflict = Canonical $c
    if ($all.Contains($canonicalConflict)) {
      $pair = @($id,$canonicalConflict) | Sort-Object
      $key = "$($pair[0]) <> $($pair[1])"
      if ($conflicts -notcontains $key) { $conflicts += $key }
    }
  }
}
if ($conflicts.Count -gt 0) {
  Write-Host "CAPABILITY CONFLICT"
  $conflicts | ForEach-Object { Write-Host " - $_" }
  exit 3
}

# Topological sort.
$ordered = New-Object System.Collections.Generic.List[string]
$visiting = New-Object System.Collections.Generic.HashSet[string]
$visited = New-Object System.Collections.Generic.HashSet[string]

function Visit([string]$id) {
  if ($visited.Contains($id)) { return }
  if ($visiting.Contains($id)) { throw "Capability dependency cycle at: $id" }
  [void]$visiting.Add($id)
  foreach ($dep in @($byId[$id].depends_on)) { Visit (Canonical $dep) }
  [void]$visiting.Remove($id)
  [void]$visited.Add($id)
  $ordered.Add($id)
}

foreach ($id in @($all)) { Visit $id }

[ordered]@{
  requested = $requested
  resolved = @($ordered)
  conflicts = @()
}
