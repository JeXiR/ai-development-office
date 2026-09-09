# AI Development Office v1.1.8 — Queue Typecheck Hotfix

## Fixed

- `canonicalQueueSnapshot()` now uses the existing `Project` type declared in `bridge/server.ts`.
- Removes the invalid `OfficeProject` type reference introduced in v1.1.7.

## Preserved

- Queue Manager.
- Cancel one / selected / all queued tasks.
- Clear stale queue.
- Dynamic version UI.
- `ATTENTION REQUIRED` when blocked work exists.
