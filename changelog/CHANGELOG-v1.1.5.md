# AI Development Office v1.1.5 — Typecheck Hotfix

## Fixed

- Imports `createHash` from `node:crypto` explicitly instead of calling `crypto.createHash` on the DOM/global Crypto type.
- Work-item fallback IDs now use the correctly typed Node `createHash`.
- Uses the existing `WorkItem.commandId` field instead of undeclared `lastCommandId`.
- Adds the persisted `lastResult?: string | null` field to `WorkItem`.
- Preserves the defensive `mergeWorkItems()` rewrite from v1.1.4.

## Preserved

- Findings reconciliation from v1.1.2.
- Canonical backlog precedence and evidence-weighted coverage precedence.
- Queue deduplication.
- Infrastructure/dependency failure classification.
