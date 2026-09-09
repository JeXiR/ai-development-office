# Workflow Command Router

User gives a short intent.

Examples:
- continue
- next
- plan next
- implement next
- fix next
- review
- validate
- sync
- handoff
- release

Flow:
1. read PROGRESS.md
2. read PROJECT_STATE.md
3. read current-task.json
4. inspect relevant docs/repository
5. resolve intent
6. resolve next action
7. choose required skills
8. execute workflow
9. update project memory
10. report concise result + next action
