---
name: mobile-build-release
description: Prepare reproducible iOS and Android builds, signing, environment configuration, release channels and store submissions.
---

# Mobile Build & Release

Define environments:
- development
- preview/staging
- production

Requirements:
- reproducible config
- correct bundle/application IDs
- signing ownership documented
- environment-specific API endpoints
- version/build numbering strategy
- release notes
- store metadata/privacy declarations
- rollback/hotfix strategy

Do not store signing secrets in source control.
