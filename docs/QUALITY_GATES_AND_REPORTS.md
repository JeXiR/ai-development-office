# Quality Gates & Task Reports

A successful runner exit does not prove a work item is resolved.

Lifecycle:

```text
PLAN
-> EXECUTION
-> runner success
-> qualityGateStatus = pending_reaudit
-> current source is re-audited
-> gap disappears
-> qualityGateStatus = verified
```

Every executed task writes:

```text
<project>/.ai-kit/task-reports/<command-id>.json
```

The report contains plan path, provider, role/lane, dependency list,
timestamps, result summary and quality-gate status.
