---
name: project-context
description: Analyze project documentation, structure, dependencies and existing conventions before substantial implementation.
---

# Project Context

Use this skill before large features, refactors, integrations, migrations, or architecture changes.

## Workflow
1. Inspect project structure.
2. Read `docs/PROJECT_STATE.md` when available.
3. Read relevant documentation and ADRs.
4. Determine framework/runtime versions from project manifests.
5. Search for similar existing implementations.
6. Identify conventions already used by the codebase.
7. Identify referenced legacy projects, purchased templates, or Figma sources.
8. Distinguish reusable patterns from obsolete implementation details.
9. Plan the smallest compatible change.
10. Only ask questions for decisions that cannot be inferred and materially change implementation.
