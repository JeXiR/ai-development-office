# Quality Gates & Task Reports

A successful runner exit does not prove a work item is resolved.

Lifecycle:

```text
PLAN
-> EXECUTION
-> runner success
-> independent verifier PASS
-> qualityGateStatus = pending_reaudit
-> Re-check Done (`recheck completed work`) PASS
-> qualityGateStatus = verified
```

Independent verify is not the last gate. Mutating Continue / Fix Next / execute-work stay `pending_reaudit` until **Re-check Done** completes for that project; that command marks those completed mutating rows `verified`. Recheck itself is read-only (`execution_passed`).

Every executed task writes:

```text
<project>/.ai-kit/task-reports/<command-id>.json
```

The report contains plan path, provider, role/lane, dependency list,
timestamps, result summary and quality-gate status.
