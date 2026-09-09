# Dependency Graph Scheduler

v0.13 introduces dependency-aware execution on top of role-lane parallelism.

Work items may contain:

```json
{
  "dependencyIds": ["BE-contact-api"]
}
```

The scheduler will not release the item until each dependency command is completed.

For same-sprint work, a conservative inference layer may add dependencies:

- Frontend may depend on matching Backend / Database / Feature work.
- Tests may depend on matching implementation work.
- Security verification may depend on matching implementation work.

The graph is persisted at:

```text
<project>/.ai-kit/office-dependency-graph.json
```

Dependency inference is deliberately conservative. Unrelated work remains parallel.
