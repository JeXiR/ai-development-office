# AI Development Office v1.1.4 — Defensive Work-Item Merge Hotfix

## Fixed

- Rewrote `mergeWorkItems()` defensively instead of patching individual crash lines.
- All historical and incoming work items are normalized before key generation.
- Missing `title` falls back to description, then id, then `Untitled work item`.
- Missing `source` receives a safe fallback.
- No merge path calls `.toLowerCase()` on a possibly undefined title.
- Active legacy rows are preserved after normalization; terminal historical rows are not resurrected.
- Duplicate normalized work items are suppressed.
- Reconciled work-item ledger is persisted after the safe merge.

## Preserved

- v1.1.2 findings reconciliation.
- v1.1.1 canonical backlog precedence.
- Evidence-weighted coverage precedence.
- Queue deduplication.
- Infrastructure/dependency failure classification.
