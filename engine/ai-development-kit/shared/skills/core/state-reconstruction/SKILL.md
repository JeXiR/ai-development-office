---
name: state-reconstruction
description: Reconstruct PROGRESS.md, PROJECT_STATE.md and current-task state when existing state is missing, empty, template-only or stale.
---

# State Reconstruction

Trigger when state is:
- missing
- empty
- template-only
- materially stale versus docs/repository

Evidence precedence:
1. repository/runtime/test/migration evidence
2. architecture/specification docs
3. roadmap/TODO docs
4. existing project state

Reconstruct:
- canonical roadmap linkage
- completed / partial / todo
- blockers / bugs
- validation state
- current milestone
- active task
- next action

Do not run deep project audit merely to answer status unless state reconstruction requires targeted verification.
