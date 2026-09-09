---
name: docker-healthchecks
description: Define container health checks aligned with liveness/readiness and orchestration behavior.
---

# Docker Health Checks

Prefer:
- lightweight HTTP health endpoint for web
- process-level health for workers
- scheduler process checks for dedicated scheduler containers

Health checks should be cheap and stable.
Do not make liveness depend on every external dependency.
