# AI Handoff / Continuation Workflow

## Before work
1. Read root `PROGRESS.md`.
2. Read `.ai-kit/current-task.json` if present.
3. Read relevant feature/ADR docs.
4. Inspect repository evidence.
5. Determine first verified incomplete item.

## During work
6. Keep scope aligned with active task.
7. Record material discoveries.
8. Do not silently switch milestones.

## After meaningful progress
9. Update `PROGRESS.md`.
10. Update current task state.
11. Record validation results.
12. Record blockers/errors/debt.
13. Write next concrete action.

## Agent switch
14. Generate `.ai-kit/HANDOFF.md`.
15. Next agent reads handoff + PROGRESS before editing.
