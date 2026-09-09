---
name: next-action-resolver
description: Resolve the single next concrete action from PROGRESS.md, current-task state, blockers, bugs and milestone priorities.
---

# Next Action Resolver

Priority:
1. blocking failures
2. active task unfinished step
3. critical bug
4. current milestone next prerequisite
5. planned feature next step
6. technical debt only if nothing higher priority exists

Return one next action, not a vague list.

If the next action requires an unresolved architecture decision, route to decision workflow instead of implementation.


## v3.3.1 risk-based selection
Use `risk-priority-engine` for verified findings.
Every non-trivial selection MUST persist a concise `selected_reason`.
Do not choose merely by list position or shared severity.
