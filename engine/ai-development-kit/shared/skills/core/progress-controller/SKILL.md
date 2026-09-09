---
name: progress-controller
description: Keep PROGRESS.md synchronized with actual project work using checklist-based milestones, defects, debt, validation and next actions.
---

# Progress Controller

## Required sections
- Project status
- Current milestone
- Active task
- Completed
- In progress
- Todo
- Bugs / errors
- Technical debt
- Blockers
- Validation
- Recent decisions
- Next actions

## Checklist semantics
Use:
- [x] completed and verified
- [ ] pending
- [~] in progress
- [!] blocked / failed

If markdown renderers do not support custom symbols consistently, preserve textual status labels.

## Updating
After a meaningful work unit:
1. verify actual changes
2. update affected checklist items
3. add discovered bugs/debt
4. record failed validations
5. set the next concrete action

Avoid rewriting historical context unnecessarily.
