---
name: docker-compose
description: Define local and single-host multi-service environments using Docker Compose with portability toward managed container platforms.
---

# Docker Compose

Typical services:
- app/web
- worker
- scheduler
- database
- redis/cache
- optional mail/dev tools

Rules:
- use named volumes only for state that must persist
- use healthchecks and dependency readiness intentionally
- do not embed secrets in compose files
- keep environment-specific values external
- make app/worker use the same image when practical
- avoid relying on host-only paths that prevent CI/cloud migration
