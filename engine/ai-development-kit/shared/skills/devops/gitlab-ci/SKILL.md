---
name: gitlab-ci
description: Build GitLab CI pipelines with staged validation, artifacts, protected variables and environment-aware deploy jobs.
---

# GitLab CI

Use:
- explicit stages
- protected variables
- artifacts/caches intentionally
- rules/only conditions for deploy
- manual gates for production when appropriate

Keep build/test/deploy concerns separated.
