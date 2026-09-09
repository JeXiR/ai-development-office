# AI Development Office v1.1.3 — Kit Listener Crash Hotfix

## Fixed

- `mergeWorkItems()` no longer assumes every historical `office-work-items.json` entry contains a string `title`.
- Historical rows without a usable title are ignored during old-ledger key construction.
- Incoming malformed work items without a usable title are skipped instead of crashing the listener.
- Missing historical `source` values safely fall back to `legacy`; incoming missing sources fall back to `unknown`.
- A single malformed state row can no longer terminate `kit-listener` and, via `concurrently -k`, stop WEB and BRIDGE.

## Preserved

- v1.1.2 findings reconciliation.
- v1.1.1 canonical backlog precedence.
- Evidence-weighted coverage precedence.
- Queue deduplication.
- Infrastructure/dependency failure classification.
