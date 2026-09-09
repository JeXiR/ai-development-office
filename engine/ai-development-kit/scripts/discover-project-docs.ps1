param([Parameter(Mandatory=$true)][string]$ProjectPath)

$docs = Join-Path $ProjectPath "docs"
$ai = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $ai | Out-Null

$result = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    docs_exists = (Test-Path $docs)
    documents = @()
    roadmap_candidates = @()
    product_candidates = @()
    architecture_candidates = @()
    decision_candidates = @()
    status_candidates = @()
}

if (Test-Path $docs) {
    Get-ChildItem $docs -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.Extension -in @(".md",".txt",".yaml",".yml",".json") } |
      ForEach-Object {
        $rel = $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
        $name = $_.Name.ToLower()
        $result.documents += $rel

        if ($name -match 'roadmap|todo|plan|milestone|phase|yol.harita') { $result.roadmap_candidates += $rel }
        if ($name -match 'product|requirements|readme|vision|mvp|spec') { $result.product_candidates += $rel }
        if ($name -match 'architecture|stack|repo.structure|data.model') { $result.architecture_candidates += $rel }
        if ($name -match 'decision|adr') { $result.decision_candidates += $rel }
        if ($name -match 'progress|state|status|stability') { $result.status_candidates += $rel }
      }
}

$result | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $ai "docs-discovery.json") -Encoding UTF8

Write-Host "Documents: $($result.documents.Count)"
Write-Host "Roadmap candidates: $($result.roadmap_candidates.Count)"
Write-Host "Product candidates: $($result.product_candidates.Count)"
