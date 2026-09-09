# CURSOR.md

## AI Development Kit

This project uses the AI Development Kit.

Before substantial work:
1. read PROGRESS.md
2. read PROJECT_STATE.md
3. read .ai-kit/current-task.json
4. inspect relevant docs and repository evidence
5. select only required skills

Short commands:
- status
- continue
- plan next
- implement next
- fix next
- review
- review project
- validate
- sync project
- handoff
- release
- decide

Do not invent completed work.
Update project state after meaningful verified changes.

<!-- AI-KIT:CURSOR-TELEMETRY:START -->
## AI Development Kit Office Telemetry

For recognized AI Development Kit short commands, truthful Office telemetry is mandatory when
`.ai-kit/tools/emit-office-command.ps1` exists.

Recognized commands:
`status`, `sync state`, `review project`, `fix next`, `validate`, `continue`,
`decide`, `handoff`, `discover project`, `sync docs`.

### Start
Before command work:
```powershell
.\.ai-kit\tools\emit-office-command.ps1 -ProjectPath "." -Command "<exact command>" -Phase "start"
```

### Real phases
Emit role events only when that real work is actually happening:
- orchestration -> CEO
- roadmap/state -> PM / Docs
- architecture -> Architect
- backend -> Backend
- frontend -> Frontend
- database/migrations -> Database
- tests -> QA
- security -> Security
- CI/deploy/ops -> DevOps

Example:
```powershell
.\.ai-kit\tools\emit-office-event.ps1 -ProjectPath "." -ActorId "security" -Role "Security" -EventType "task_progress" -Status "reviewing" -Task "Security audit" -Message "Reviewing verified security scope"
```

### Finish
After successful command completion:
```powershell
.\.ai-kit\tools\emit-office-command.ps1 -ProjectPath "." -Command "<exact command>" -Phase "done"
```

On failure use `-Phase "error"`.

Telemetry writes under `.ai-kit` are allowed for read-only commands and do not count as user application code changes.
Never inject Office telemetry or attribution into application source code.
<!-- AI-KIT:CURSOR-TELEMETRY:END -->

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
