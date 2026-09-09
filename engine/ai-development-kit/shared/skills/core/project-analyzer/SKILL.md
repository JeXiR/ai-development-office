---
name: project-analyzer
description: Analyze an existing repository and generate an evidence-based architecture profile for Cursor and Claude skill routing.
---

# Project Analyzer

Analyze before modifying an unfamiliar or existing project.

Inspect:
- composer.json / composer.lock
- package.json and lock files
- framework config
- source directories
- database config/schema
- Docker/Compose
- CI/CD
- mobile configs
- infrastructure docs
- existing AI instructions
- docs/references and ADRs

Detect:
- language/runtime
- frontend framework/rendering
- backend framework/API style
- database/ORM
- auth/authorization
- queue/cache
- mobile stack
- UI/design system
- animation libraries
- charts
- testing/lint/typecheck
- Docker/hosting/cloud
- external references

Rules:
- distinguish detected facts from inference
- never overwrite docs silently
- flag documentation drift
- do not infer AWS merely because an AWS SDK package exists
- do not infer production usage from an unused dependency
- prefer executable repository evidence

Output should populate/update an architecture profile suitable for `find-skill`.
