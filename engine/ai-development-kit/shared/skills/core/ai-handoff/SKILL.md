---
name: ai-handoff
description: Create reliable handoffs between Cursor, Claude and future coding agents using project state, active task context, decisions and remaining risks.
---

# AI Handoff

A handoff should answer:

1. What are we working on?
2. What changed?
3. What is verified?
4. What is not verified?
5. What is broken or blocked?
6. What decisions were made?
7. Which files/modules matter?
8. What should the next agent do first?

## Sources
- `PROGRESS.md`
- `.ai-kit/current-task.json`
- docs/features
- docs/decisions
- Git diff/status when available
- test/security/build outputs

## Rules
- never claim tests/builds passed unless actually run
- never claim a file changed unless repository evidence shows it
- separate facts from assumptions
- include unresolved risk explicitly
