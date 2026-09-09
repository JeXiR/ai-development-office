# Status

This command is strictly READ-ONLY except for repairing missing AI Development Kit state files.

1. Ensure required AI state files exist.
2. Read PROGRESS.md, PROJECT_STATE.md, .ai-kit/current-task.json, relevant docs and repository evidence.
3. Report only:
   - current milestone
   - active task
   - completed work
   - blockers
   - bugs/errors
   - validation state
   - single next action
4. Do not modify application code.
5. Do not fix anything.
6. Do not start review/project audit.
7. Do not ask how to proceed.
8. Stop after returning status.

If state files are missing, repair only those state files, then return status.


Before reporting:
- detect missing, template-only, or stale project state
- if reconstruction is required, run project discovery + state reconstruction first
- if no usable roadmap/product intent exists, ask "What do you want to build?" and stop for that answer
- otherwise reconstruct state and then return status

## Final response requirement

Before returning status, resolve the actual active project root and read its `.ai-kit/settings.json`.
The complete status response MUST use that project's `responseLanguage`.
Do this after gathering runtime/project evidence and immediately before the final answer.
If the current editor folder differs from the resolved active project, use the active project's language preference.
