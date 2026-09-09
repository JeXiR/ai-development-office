---
name: project-memory
description: Maintain a durable project memory in PROGRESS.md and related state files so Cursor and Claude continue from written evidence instead of assumptions.
---

# Project Memory

`PROGRESS.md` at the project root is the canonical human-readable working state.

Use it to record:
- current milestone
- active task
- completed work
- pending work
- known bugs
- technical debt
- blockers
- decisions made during implementation
- files/modules recently touched
- validation status
- next recommended action

## Rules
- read `PROGRESS.md` before substantial continuation work
- update it after meaningful progress
- never mark something complete without evidence
- distinguish DONE / IN PROGRESS / TODO / BLOCKED / FAILED
- do not duplicate full documentation; link to docs/ADRs/features
- do not store secrets or sensitive values
- preserve user-authored notes
- prefer explicit unknowns over invented state
