# Plan-First Execution Contract

Mutating Office tasks must not jump directly into implementation.

Canonical lifecycle:

```text
queued
  ↓
planning
  ↓
plan_ready
  ↓
running
  ↓
verifying
  ↓
completed
```

Failure may occur at any stage.

## Planning rules

Planning is read-only.

The planning runner must:
1. inspect actual repository evidence
2. identify likely files
3. propose steps
4. describe risks
5. define tests/validation
6. define acceptance criteria
7. define rollback/stop conditions

The plan is persisted at:

```text
<project>/.ai-kit/office-plans/<command-id>.md
```

Implementation must consume that plan.

If the plan artifact is missing, execution is blocked.

## Commands requiring plans

- fix next
- continue
- fix finding
- execute work item

Read-only commands such as status/review/readiness do not require an implementation plan.
