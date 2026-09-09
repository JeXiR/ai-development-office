---
name: health-checks
description: Define liveness, readiness and dependency-aware health checks for web, worker and container deployments.
---

# Health Checks

Separate:
- liveness: process can continue running
- readiness: instance can safely receive work
- dependency diagnostics: detailed operator view

Do not make liveness depend on every external service.
Readiness may include critical dependencies.
Keep public health responses minimal and non-sensitive.
