param(
  [Parameter(Mandatory=$true)][string[]]$Capabilities,
  [string]$KitRoot = (Split-Path -Parent $PSScriptRoot)
)

$registry = Get-Content (Join-Path $KitRoot "shared\compositions\registry.json") -Raw | ConvertFrom-Json
$required = @($Capabilities | Sort-Object -Unique)

$best = $null
$bestScore = -1

foreach ($composition in $registry.compositions) {
  $caps = @($composition.capabilities | Sort-Object -Unique)
  $covered = @($required | Where-Object { $caps -contains $_ }).Count
  $missing = @($required | Where-Object { $caps -notcontains $_ }).Count
  if ($missing -eq 0) {
    $score = 10000 - ($caps.Count - $required.Count)
    if ($score -gt $bestScore) {
      $bestScore = $score
      $best = $composition
    }
  }
}

if ($best) {
  [ordered]@{ type="named"; id=$best.id; capabilities=@($best.capabilities) }
} else {
  [ordered]@{ type="ad-hoc"; id="adhoc-$([guid]::NewGuid().ToString('N').Substring(0,8))"; capabilities=$required }
}
