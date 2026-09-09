---
name: github-actions
description: Build secure GitHub Actions workflows with scoped permissions, caching, matrix/runtime setup and deployment environments.
---

# GitHub Actions

Use:
- explicit `permissions`
- environment protection for production
- dependency cache
- pinned/maintained actions
- secret references, never literal secrets

Prefer separate jobs for:
- validate
- security
- build
- deploy

Use concurrency controls for deployments where overlapping releases are unsafe.
