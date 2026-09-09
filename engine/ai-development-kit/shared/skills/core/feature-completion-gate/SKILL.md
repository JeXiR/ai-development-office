---
name: feature-completion-gate
description: Decide whether a feature is ready to be considered complete based on correctness, security, tests, observability, docs and deployment safety.
---

# Feature Completion Gate

A feature is not complete if any required gate is failing.

Possible blockers:
- failing build/typecheck/tests
- unresolved security HIGH/CRITICAL
- migration BLOCKER
- API contract drift
- missing required authorization
- broken tenant isolation
- missing critical observability
- undocumented destructive operational step

Mark non-blocking debt separately.
