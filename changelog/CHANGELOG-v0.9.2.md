# AI Development Office v0.9.2

Author: JeXiR (Halil Cinkilinc)

## Plan-first safety
- Mutating tasks no longer execute immediately.
- New lifecycle: queued -> planning -> plan_ready -> running -> verifying -> completed.
- Architect generates a read-only implementation plan first.
- Plan persists under `.ai-kit/office-plans/<command-id>.md`.
- Execution consumes the persisted plan.
- Missing/invalid plan blocks implementation.
- Plan includes evidence, files, steps, risks, tests, acceptance criteria and stop conditions.

## Live telemetry synchronization
- Agent state now overlays recent real events from `.ai-kit/events.jsonl`.
- `task_started` events make the appropriate agent visibly active.
- QA maps to testing, Security to reviewing, other workers to working.
- Completed activity decays back to idle after a short period.
- Active state TTL prevents permanent stale green status.

## Visibility
- Active Team Presence cards now use strong green border/glow.
- Agent Activity cards use strong active green.
- Pixel Office footer chips use larger green status lights.
- Queue has distinct planning / plan_ready / verifying styles.
