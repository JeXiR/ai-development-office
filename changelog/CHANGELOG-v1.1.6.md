# AI Development Office v1.1.6 — Nullable Typecheck Hotfix

## Fixed

- `safeString()` now accepts nullable fallbacks (`string | null | undefined`).
- Nullable `WorkItem.commandId` and `WorkItem.lastResult` can safely pass through merge reconciliation without TypeScript errors.
- Null fallbacks normalize to an empty string rather than leaking `null` into string-only fields.

## Preserved

- Defensive work-item merge from v1.1.4.
- Findings reconciliation from v1.1.2.
- Canonical backlog and evidence-weighted coverage precedence.
- Queue deduplication and infrastructure/dependency classification.
