# AI Development Kit — Short Commands

You should not need long prompts.

Use these in Cursor or Claude:

## `continue`
Continue from PROGRESS.md and current-task.json.

## `plan next`
Plan the next milestone/task without implementing it.

## `implement next`
Implement the first verified implementation-ready item.

## `fix next`
Fix the highest-priority real bug/blocker.

## `review`
Review the current work.

## `validate`
Run the relevant quality/security/test/migration/API/CI gates.

## `sync project`
Re-analyze the project and synchronize profile, skills and drift.

## `handoff`
Prepare project state for switching between Cursor and Claude.

## `release`
Prepare and validate a release.

## `status`
Summarize current milestone, active task, blockers, bugs, validation and next action.

## `decide`
Resolve current DECISION REQUIRED items from docs/ADRs. Escalate only material choices.

---

The router must use written project state and repository evidence.
It must not rely on conversation memory alone.


## `review project`
Perform a full read-only audit of the repository against project state and docs.
Find and rank bugs, missing implementation, architecture drift, security/data/API/UI/test/ops problems and technical debt.
Verified findings are written into project state; application code is not changed.

## Automatic state repair
`status` and `review project` must create/repair missing required project state files before continuing:
`PROGRESS.md`, `PROJECT_STATE.md`, `CLAUDE.md`, `CURSOR.md` and required `.ai-kit` state.


## Command isolation

`status` is strictly read-only and stops after the status report.

`review project` is also read-only with respect to application code and does not require Git. If the repository has no `.git`, the audit proceeds directly from the filesystem and project evidence.

Short commands never automatically chain into another command.


## `discover project`
Discover product intent, roadmap and architecture from docs/repository. Normalize documentation and establish canonical roadmap.

## `sync docs`
Normalize and reconcile project documentation without a deep application audit.

## `sync state`
Rebuild PROGRESS.md / PROJECT_STATE.md / current task from the canonical roadmap and repository evidence.

## State bootstrap
`status` first detects missing, empty, template-only or stale state. If needed it performs discovery/reconstruction before reporting status. If no usable project idea/roadmap exists, it asks what the user wants to build.


## `check project readiness`
Compare canonical project requirements against implemented kit capabilities/presets/scaffolds.
Outputs `.ai-kit/project-readiness.json`.
Blocks scaffold on MISSING/PARTIAL/CONFLICT.


## `scaffold project`
Requires project readiness `READY`.
Uses the v3.5 capability graph and generic scaffold orchestrator.

## `resolve capabilities`
Normalize required stack into canonical capability IDs and dependency order.
