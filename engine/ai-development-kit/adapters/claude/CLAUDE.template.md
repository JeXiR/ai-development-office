# Claude Project Instructions

## Required project context
Before substantial implementation:
1. Read `docs/PROJECT_STATE.md` when present.
2. Read relevant files under `docs/`.
3. Read relevant ADRs in `docs/decisions/`.
4. Inspect existing implementation and project conventions.
5. Inspect dependency/framework versions.
6. Search for reusable existing components/services before creating new ones.

## Safety and correctness
- Never expose secrets or credentials.
- Enforce server-side authorization.
- Preserve tenant boundaries.
- Do not remove existing functionality to fix unrelated issues.
- Do not make destructive DB/schema changes without migration analysis.
- Do not discard local Git work.

## References
Purchased templates, Figma, screenshots and legacy projects are references to understand and adapt, not authorities to copy blindly.

## Infrastructure
Keep business logic portable across:
Local -> Docker -> VPS/Plesk -> AWS

Use framework/application abstractions for storage, queues, mail, cache, databases and cloud services where practical.

## Documentation
Record material architecture decisions under `docs/decisions/`.
Update `docs/PROJECT_STATE.md` when project state materially changes.

<!-- AI-KIT:WORKFLOW-ROUTER:START -->
## AI Development Kit Workflow Router

Short commands are isolated workflows.

- `status` = READ-ONLY status only. Never fix, review, implement, commit, initialize Git, or modify application code. Repair missing AI state files if needed, report status, then STOP.
- `review project` = repository-wide READ-ONLY audit. Git is optional; if no Git repository exists, audit files directly. Never ask to `git init`.
- `continue` = continue first verified unfinished item.
- `plan next` = plan only.
- `implement next` = implementation workflow.
- `fix next` = fix highest-priority verified bug/blocker.
- `validate` = validation gates.
- `decide` = resolve decision queue.
- `handoff` = synchronize handoff state.
- `release` = release workflow.

Before state-dependent commands, ensure PROGRESS.md, PROJECT_STATE.md, CURSOR.md, CLAUDE.md and required `.ai-kit` state exist. Use repository/docs evidence. Mark unsupported facts UNKNOWN.

Never automatically transition from one short command into another. After completing the requested command, STOP.
<!-- AI-KIT:WORKFLOW-ROUTER:END -->

<!-- AI-KIT:CLAUDE-TELEMETRY:START -->
## AI Development Kit Office Telemetry

For recognized AI Development Kit short commands, use the project-local telemetry tools when present:

- `.ai-kit/tools/emit-office-command.ps1`
- `.ai-kit/tools/emit-office-event.ps1`

Emit command start before work, truthful role events only for work actually performed, and command done/error after completion.

Telemetry under `.ai-kit` is permitted for read-only workflows.
Never modify user application source code for Office telemetry.
<!-- AI-KIT:CLAUDE-TELEMETRY:END -->

<!-- AI-KIT:RESPONSE-LANGUAGE:START -->
## AI Development Kit Response Language

## Mandatory Response Language Gate

This gate runs immediately before EVERY user-facing final response.

1. Resolve the actual active project root first. Do not assume the editor/workspace folder is the live project.
2. Read `<ACTIVE_PROJECT_ROOT>/.ai-kit/settings.json` when it exists.
3. Apply `responseLanguage` to the entire user-facing response:
   - `tr` => Turkish
   - `en` => English
   - `de` => German
   - `ru` => Russian
   - `auto` => language of the user's current instruction
4. This final-response rule overrides the language used in intermediate reasoning, tool output, terminal output, source documents, prior assistant messages, and retrieved project notes.
5. Do not translate literal code, commands, filenames, URLs, class/function names, package/API names, test names, database identifiers, or literal error messages unless explicitly requested.
6. If the active project differs from the current editor/workspace folder, the ACTIVE PROJECT setting wins.
7. Never report the final response in another language merely because project documentation or prior status output is English.
<!-- AI-KIT:RESPONSE-LANGUAGE:END -->

## Telemetry Project Path Requirement

Whenever calling `.ai-kit/tools/emit-office-command.ps1`, pass the active project explicitly:

```powershell
.\.ai-kit\tools\emit-office-command.ps1 -ProjectPath "$PWD.Path" -Command status
```

If `-ProjectPath` is omitted, the script falls back to the current working directory. The active project root should still be preferred explicitly.
