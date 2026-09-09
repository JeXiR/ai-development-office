# AI Development Office v2.0.1 — Typecheck Validation Patch

## 2.0.1 — Typecheck Validation Patch

### Fixed
- Awaited bridge actions now run inside an async WebSocket message handler.
- Autonomy uses the actual project-state and provider-health APIs.
- Security regression uses WorkspaceService.read().
- Workspace listing hides common `.env` files.
- Task DAG reads Director/collaboration tasks from the collaboration store.
- Duplicate Memory v2 imports removed.
- Workspace search uses the real flat file store.
- Obsolete legacy-memory socket handlers removed from Memory v2.
- Safety v2 command classifier regex/type definitions corrected.

### Validation
- Patch created from the first real v2.0.0 user-side typecheck.
- Final validation remains pending.


Created and maintained by **JeXiR (Halil Cinkilinc)**.
