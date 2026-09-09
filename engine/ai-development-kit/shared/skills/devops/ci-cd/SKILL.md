---
name: ci-cd
description: Build CI/CD pipelines that validate code consistently and deploy only verified artifacts.
---

# CI/CD

Typical validation:
- dependency integrity
- lint/format check
- type check
- automated tests
- production build
- security/dependency checks where appropriate

Build once; promote the same immutable artifact where practical.
Keep deployment credentials scoped to the minimum permissions.
Do not expose secrets in CI logs.
