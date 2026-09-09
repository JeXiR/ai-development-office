---
name: release-readiness
description: Gate releases on tests, migrations, contracts, Docker/IaC, secrets/configuration and operational readiness.
---

# Release Readiness

Potential blockers:
- failing tests/build
- unresolved critical security issue
- destructive migration without plan
- API breaking change without migration path
- missing env/secrets
- unvalidated Docker/IaC
- missing rollback for high-risk deployment
