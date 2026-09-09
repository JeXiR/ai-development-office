---
name: production-docker-generator
description: Generate production-oriented Docker architecture from the actual project stack, including web, worker and scheduler roles.
---

# Production Docker Generator

## Goals
- reproducible builds
- multi-stage images
- minimal runtime image
- non-root runtime where practical
- explicit health checks
- separate web/worker/scheduler lifecycle
- dev/prod separation
- ECS/Fargate portability
- no secrets baked into image

## Analyze first
Inspect:
- framework/runtime versions
- package manager
- build output
- static assets
- queue workers
- scheduler
- health endpoint
- native dependencies
- storage/write requirements

Do not generate a generic Dockerfile blindly.
