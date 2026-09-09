# Project Audit Workflow

Trigger:
- review project
- audit project
- full review

1. Ensure project state files exist; bootstrap/repair missing state.
2. Read project state and repository/docs.
3. Select audit-relevant skills.
4. Perform read-only repository-wide audit.
5. Rank findings by severity.
6. Add verified bugs/debt/blockers to PROGRESS.md.
7. Update PROJECT_STATE.md only for durable verified state/drift.
8. Set next_action to the highest-priority actionable verified finding.
9. Do not modify application code.
10. Report health, findings, missing areas, and next action.
