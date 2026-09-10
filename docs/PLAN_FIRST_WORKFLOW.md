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

Owned files on the subtask contract come from that plan. Extraction keeps real extensions (`package.json` is not captured as `package.js`). `.ai-kit/` paths and kit-only basenames such as `current-task.json` are not owned files. A name with no directory is kept only if it exists at the project root or is a known root doc (`PROGRESS.md`, `README.md`, …).

## Commands requiring plans

- fix next
- continue
- fix finding
- execute work item

Read-only commands such as status/review/readiness do not require an implementation plan.

## Continue / Fix Next from Command Center

Mission Commands queue these as **collaborative** (isolated worktree + squash merge) when Git is clean.

If the working tree is dirty, isolation is unavailable and the command falls back to **Solo**. After the independent verifier passes, Solo still records an `office-factory:` commit of product files and kit docs (`PROGRESS.md`, `docs/…`), matching factory merge. Untracked `.ai-kit/` is not added.

Continue and Fix Next bind `workItemId` / title from `.ai-kit/current-task.json` when the queue payload does not already set them.
