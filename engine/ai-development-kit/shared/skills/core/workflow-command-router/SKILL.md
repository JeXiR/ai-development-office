---
name: workflow-command-router
description: Convert short user intents such as continue, plan, implement next, review, fix, release or audit into the correct AI Development Kit workflow automatically.
---

# Workflow Command Router

## Goal
The user should not need to remember long prompts.

Interpret short commands using project state and repository evidence.

## Canonical commands

### continue
Read:
- PROGRESS.md
- PROJECT_STATE.md
- .ai-kit/current-task.json
- relevant feature/phase docs

Then continue the first verified unfinished item.

### plan next
Determine the next milestone/task from PROGRESS and docs.
Create/update the appropriate feature/phase plan.
Do not implement unless explicitly requested.

### implement next
Read state, select skills, execute the first verified implementation-ready item.
Update PROGRESS/current-task after meaningful work.

### review
Review the current task/change for:
- correctness
- architecture
- security
- tests
- migration/API impact
- docs drift

### fix next
Find the highest-priority verified bug/blocker in PROGRESS and fix it.
Do not pick speculative improvements before real blockers.

### sync project
Re-analyze repository and synchronize project profile/skills/docs drift.

### validate
Run the relevant completion gates for the current task.

### handoff
Update PROGRESS/current-task and generate HANDOFF.md.

### release
Run release workflow and readiness gates.

## Rules
- never require the user to reconstruct long prompts
- infer workflow from written project state
- if multiple tasks exist, choose by BLOCKER > BUG > active milestone > TODO priority
- never invent completion state


### review project
Run repository-wide read-only project-audit.
Ensure required project state files exist first.
Record verified findings in project state after the audit.

### status state-repair rule
Before `status`, ensure required project state files exist.
If PROGRESS.md, PROJECT_STATE.md, CLAUDE.md, CURSOR.md or required .ai-kit state is missing, create/repair it from repository evidence first, then return status.
Do not stop merely because state files are missing.


## Strict command isolation

### status is READ-ONLY
`status` must never:
- modify application code
- fix bugs
- run implementation workflows
- start code review
- create commits
- initialize git
- change migrations
- change docs except creating/repairing missing AI state files required to report status

`status` may:
- read repository/docs/state
- run non-mutating inspection commands
- repair missing AI Development Kit state files only
- return a concise state summary

After status, stop. Do not continue into `review`, `fix`, `continue`, or `implement next` unless the user explicitly sends that command.

### review project is READ-ONLY application-wise
`review project` must not require Git.
If Git is unavailable:
- perform repository-wide file/module audit directly
- use docs, tests, static analysis, routes, manifests, config and repository evidence
- do not ask the user whether to `git init`
- do not initialize Git unless explicitly requested

Git diff is optional evidence, not a prerequisite for project audit.


### discover project
Run project-discovery-engine.
Normalize docs and establish a canonical roadmap before progress generation.

### sync docs
Discover, classify and normalize documentation. Do not deep-audit application implementation.

### sync state
Reconstruct state from canonical roadmap + repository evidence when state is missing, template-only or stale.

### status bootstrap order
Before normal status:
1. run state freshness check
2. if state reconstruction is required, run project discovery
3. if roadmap/project intent exists, derive state
4. if no usable project intent exists, ask the user: "What do you want to build?"
5. after state is established, return status and stop


## Office telemetry integration (v3.3.5)

If `.ai-kit` project state is active, emit real Office telemetry through `office-telemetry`.

At the start of a recognized short command:
- emit CEO `command` event with the exact command
- emit role-specific events only when that workflow actually reaches that phase

At completion:
- emit CEO `task_completed` / `done`
At failure:
- emit `error`

Never fabricate worker activity for visual effect.


### check project readiness
Use project-readiness + kit-gap-analysis + preset-composer.
Do not scaffold if readiness is not READY.
Persist `.ai-kit/project-readiness.json`.
