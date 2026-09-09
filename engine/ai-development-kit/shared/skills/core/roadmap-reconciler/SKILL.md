---
name: roadmap-reconciler
description: Reconcile canonical roadmap statuses with verified audit and validation evidence without changing product intent.
---

# Roadmap Reconciler

After `review project`, `fix next`, or `validate`:

- map findings to affected roadmap items
- downgrade unsupported/broken completion claims
- promote only after required validation
- preserve deferred/non-goal intent
- record evidence and reason

Allowed semantic transitions include:
- VERIFIED_DONE -> PARTIAL
- VERIFIED_DONE -> UNKNOWN
- PARTIAL -> VERIFIED_DONE
- TODO -> PARTIAL
- BLOCKED -> PARTIAL/TODO when blocker is removed

Never rewrite roadmap scope merely because implementation differs.
Material product conflicts become `DECISION_REQUIRED`.
