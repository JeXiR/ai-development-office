---
name: release-manager
description: Prepare a release from verified repository state with versioning, changelog, migrations, deployment checks, rollback and post-release verification.
---

# Release Manager

A release is not just a version number.

Before release verify:
- intended changes
- tests/build/static analysis
- security gates
- migrations
- API compatibility
- infrastructure/runtime changes
- required environment variables
- background workers/schedulers
- docs/progress state

Produce:
- release summary
- deployment checklist
- rollback plan
- post-release verification
- unresolved known issues

Never claim a release is safe solely because code compiles.
