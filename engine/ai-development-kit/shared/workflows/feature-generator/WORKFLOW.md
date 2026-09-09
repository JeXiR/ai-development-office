# End-to-End Feature Workflow

## Phase 1 — Understand
1. Read request.
2. Read project context/docs/references.
3. Detect stack.
4. Identify similar existing features.
5. Clarify only material unknowns.

## Phase 2 — Plan
6. Run impact analysis.
7. Select skills.
8. Resolve capabilities.
9. Check dependency conflicts.
10. Create/update feature spec.
11. Define acceptance criteria.

## Phase 3 — Architecture
12. Plan schema/data changes.
13. Run migration safety.
14. Plan backend/domain behavior.
15. Update API contract if relevant.
16. Plan frontend/mobile states.
17. Define authorization/tenant boundaries.
18. Define background work/storage/integrations.
19. Define observability.

## Phase 4 — Implement
20. Implement smallest vertical slice.
21. Add validation and authorization.
22. Add persistence/API.
23. Add UI/mobile.
24. Add async/integration work.
25. Add logging/metrics/error context.

## Phase 5 — Validate
26. Generate/update tests.
27. Run test strategy.
28. Run security audit.
29. Run contract checks.
30. Run migration safety check.
31. Run build/lint/typecheck.
32. Run local CI gates.

## Phase 6 — Complete
33. Review code.
34. Update docs/PROJECT_STATE.
35. Update ADR if architectural decision changed.
36. Record known debt.
37. Run feature completion gate.


## Project memory integration

Before Phase 1:
- read root `PROGRESS.md`
- read `.ai-kit/current-task.json`

After each meaningful phase:
- update current task state
- update PROGRESS.md when status materially changes

Before completion:
- generate handoff state so Cursor/Claude can continue reliably.


## Background job integration

When a feature introduces asynchronous work:
- run background-job-reliability
- define idempotency/retry/concurrency before considering the feature complete
- add failure/replay tests
- record queue operational requirements in PROGRESS.md when unresolved.


## File/media integration

When a feature introduces uploads/files/media:
- run file-media-pipeline
- define ownership and private/public policy
- use tenant-aware storage when applicable
- define lifecycle/retention
- add upload security and access tests
- prefer async/idempotent processing for expensive media work


## Infrastructure integration

When a feature requires infrastructure changes:
- update IaC rather than manual-only production configuration
- validate and plan
- run IaC safety review
- record environment/deployment dependencies in PROGRESS.md
- never auto-apply production infrastructure.


## Docker integration

When a feature changes runtime/process requirements:
- re-analyze Docker roles
- update production Docker/Compose
- validate build
- run Docker safety review
- update PROGRESS.md if deployment/runtime work remains.


## Frontend quality integration

When a feature changes UI:
- check performance budget
- run accessibility baseline
- review keyboard/reduced motion
- run visual regression for critical routes
- update screenshot baselines only for intentional changes
- record unresolved regressions in PROGRESS.md.


## Short-command integration

The user may start/continue this workflow with `implement next` or `continue`.
Use next-action-resolver rather than requiring a detailed prompt.
If DECISION REQUIRED blocks execution, run decision-resolver first.
