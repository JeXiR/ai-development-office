# AI Development Office v1.1.1 — State / Queue / Coverage Hotfix

## Fixed

- `.ai-kit/backlog-canonical.json` is authoritative for Ready Work when present.
- Coverage/feature scans remain informational and cannot inflate Ready Work beyond the canonical backlog.
- Historical `FIXED`, `RESOLVED`, re-verified and stale/not-authoritative audit text is excluded from new feature-contract discovery.
- Duplicate read-only commands are not queued while the same command is already queued/running.
- Evidence-weighted `.ai-kit/project-coverage.agent.json` takes precedence over the shallower Office heuristic when its confidence is equal or higher.
- Office heuristic coverage is retained as `.ai-kit/project-coverage.heuristic.json` for inspection.
- Git precondition failures, Cursor reconnect/network failures, workspace trust blocks and similar infrastructure failures no longer count as agent failures in trust analytics.
- Analytics now separates `agent failed` from `infra blocked`.

## Preserved

- v1.1 theme engine and 2× characters.
- 12px minimum typography contract.
- v1.0.1 hydration guard.
- Git worktree isolation and release safety.
- Feature freeze remains active.
