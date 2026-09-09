# Office Telemetry

During AI Development Kit commands, emit truthful workflow events to `.ai-kit/events.jsonl` using the kit event emitter when available.

Do not simulate roles merely for animation.
Do not change application code to support Office telemetry.


Use project-local emitters:

- `.ai-kit/tools/emit-office-event.ps1`
- `.ai-kit/tools/emit-office-command.ps1`

Do not rely on a machine-specific central kit path.


Office command requests may exist in `.ai-kit/command-requests.jsonl`.
Queued is not completed. Execute only through an explicit approved runner/workflow.
