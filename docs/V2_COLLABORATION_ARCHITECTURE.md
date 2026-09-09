# v2 Collaboration Architecture — alpha.3

## Components

```text
User
  ↓
Office Director
  ↓
Task decomposition
  ↓
Dependency Router
  ↓
Role / Agent assignments
  ↓
Mailbox + Blackboard + Structured Artifacts
```

## Durable state

Stored per project:

`.ai-kit/office-collaboration/state.json`

Contains:
- Director tasks
- plans
- mailbox messages
- blackboard entries
- structured artifacts

Writes are crash-safer via temp-file + rename.

## Bridge API

- `collaboration_snapshot`
- `director_plan`
- `collaboration_message`
- `collaboration_mark_read`
- `collaboration_blackboard`
- `collaboration_artifact`
- `collaboration_task_update`

## Notes

alpha.3 provides the collaboration control plane. Automatic task execution by the Director will be wired progressively after memory and safety controls are present.
