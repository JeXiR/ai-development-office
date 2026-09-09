---
name: durable-handoff-v2
description: Persist enough machine-readable workflow state for Cursor and Claude to resume the same task after interruption or provider limits.
---

# Durable Handoff v2

Persist in `.ai-kit/current-task.json`:
- schema_version = 2.0
- status
- title
- command
- phase
- last_completed_step
- next_step
- selected_reason
- evidence[]
- finding_ids[]
- validation_state
- updated_at

Rules:
- `continue` resumes `next_step`
- do not repeat `last_completed_step` unless evidence became stale/invalid
- provider identity is not project truth
- handoff must work Claude -> Cursor and Cursor -> Claude
- do not require Git
