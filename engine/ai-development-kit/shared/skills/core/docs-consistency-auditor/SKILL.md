---
name: docs-consistency-auditor
description: Detect contradictions, duplicate truth, stale plans and roadmap drift before generating project state.
---

# Docs Consistency Auditor

Check:
- conflicting stacks
- conflicting deployment choices
- duplicate PROJECT_STATE/TODO/ROADMAP files
- completed flags unsupported by implementation
- stale phases
- obsolete architecture references
- unresolved DECISION REQUIRED items

Low-risk formatting/organization issues may be fixed.
Material architectural/product conflicts must be surfaced, not invented away.
