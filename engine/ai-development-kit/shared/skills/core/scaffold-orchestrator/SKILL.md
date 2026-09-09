---
name: scaffold-orchestrator
description: Execute a resolved capability graph in dependency order and validate each capability before continuing.
---

# Scaffold Orchestrator

Workflow:
requirements -> graph -> composition -> ordered capabilities -> scaffold -> validate -> state

Stop immediately on:
- conflict
- scaffold failure
- required capability validation failure

Preset-specific framework switches are forbidden.
